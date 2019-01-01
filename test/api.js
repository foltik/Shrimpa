process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const describe = require('mocha').describe;

const ModelPath = '../app/models/';
const User = require(ModelPath + 'User.js');
const Upload = require(ModelPath + 'Upload.js');
const Key = require(ModelPath + 'Key.js');
const Invite = require(ModelPath + 'Invite.js');
const View = require(ModelPath + 'View.js');

const util = require('./testUtil.js');
const canonicalize = require('../app/util/canonicalize').canonicalize;

const config = require('config');
let app;
let server;
let agent;

before(() => {
    const main = require('../server.js');
    app = main.app;
    server = main.server;
    agent = chai.request.agent(app);
});

after(() => {
    server.close();
});

beforeEach(() => util.clearDatabase());

describe('Authentication', () => {
    describe('/POST register', () => {
        describe('0 Valid Request', () => {
            async function verifySuccessfulRegister(user) {
                await util.createTestInvite();

                const res = await util.registerUser(user, agent);
                util.verifyResponse(res, 200, 'Registration successful.');

                const userCount = await User.countDocuments({displayname: user.displayname});
                userCount.should.equal(1, 'The user should have be created in the database');

                const inviteCount = await Invite.countDocuments({
                    code: user.invite,
                    recipient: canonicalize(user.displayname)
                });
                inviteCount.should.equal(1, 'The invite should be marked as used by the user');
            }

            it('MUST register a valid user with a valid invite', async () =>
                verifySuccessfulRegister({displayname: 'user', password: 'pass', invite: 'code'})
            );

            it('MUST register a username with unicode symbols and a valid invite', async () =>
                verifySuccessfulRegister({displayname: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'pass', invite: 'code'})
            );
        });

        describe('1 Invalid Invites', () => {
            async function verifyRejectedInvite(invite, message) {
                const user = {displayname: 'user', password: 'pass', invite: 'code'};
                if (invite) {
                    await util.insertInvite(invite, agent);
                    user.invite = invite.code;
                }

                const res = await (util.registerUser(user, agent));
                util.verifyResponse(res, 422, message);

                const inviteCount = await Invite.countDocuments({
                    code: user.invite,
                    recipient: canonicalize(user.displayname)
                });
                inviteCount.should.equal(0, 'Invite should not be marked as used or received by the user');
            }

            it('MUST NOT register a nonexistant invite', async () =>
                verifyRejectedInvite(null, 'Invalid invite code.')
            );

            it('MUST NOT register a used invite', async () =>
                verifyRejectedInvite({code: 'code', used: new Date(), issuer: 'Mocha'}, 'Invite already used.')
            );

            it('MUST NOT register an expired invite', async () =>
                verifyRejectedInvite({code: 'code', expires: new Date(), issuer: 'Mocha'}, 'Invite expired.')
            );
        });

        describe('2 Invalid Displaynames', () => {
            async function verifyRejectedUsername(user, code, message) {
                const res = await util.registerUser(user, agent);
                util.verifyResponse(res, code, message);

                const inviteCount = await Invite.countDocuments({
                    code: user.invite,
                    recipient: canonicalize(user.displayname)
                });
                inviteCount.should.equal(0, 'The invite should not be inserted into the database after rejection');
            }

            it('MUST NOT register a duplicate username', async () => {
                await util.createTestInvites(2);
                const user0 = {displayname: 'user', password: 'pass', invite: 'code0'};
                const user1 = {displayname: 'user', password: 'diff', invite: 'code1'};

                await util.registerUser(user0, agent);
                return verifyRejectedUsername(user1, 422, 'Username in use.');
            });

            it('MUST NOT register a username with a duplicate canonical name', async () => {
                await util.createTestInvites(2);
                const user0 = {displayname: 'bigbird', password: 'pass', invite: 'code0'};
                const user1 = {displayname: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'diff', invite: 'code1'};

                await util.registerUser(user0, agent);
                return verifyRejectedUsername(user1, 422, 'Username in use.');
            });

            it('MUST NOT register a username containing whitespace', async () => {
                await util.createTestInvites(3);
                const users = [
                    {displayname: 'user name', password: 'pass', invite: 'code0'},
                    {displayname: 'user　name', password: 'pass', invite: 'code1'},
                    {displayname: 'user name', password: 'pass', invite: 'code2'}
                ];

                const failMsg = 'displayname contains invalid characters.';
                return Promise.all(users.map(user => verifyRejectedUsername(user, 400, failMsg)));
            });

            it('MUST NOT register a username containing HTML', async () => {
                await util.createTestInvite();
                const user = {displayname: 'user<svg/onload=alert("XSS")>', password: 'pass', invite: 'code'};
                return verifyRejectedUsername(user, 400, 'displayname contains invalid characters.');
            });

            it('MUST NOT register a username with too many characters', async () => {
                await util.createTestInvite();
                const user = {displayname: '123456789_123456789_123456789_1234567', password: 'pass', invite: 'code'};
                return verifyRejectedUsername(user, 400, 'displayname too long.');
            });
        });
    });

    describe('/POST login', () => {
        async function verifySuccessfulLogin(credentials) {
            // Login with the agent
            const res = await util.login(credentials, agent);
            util.verifyResponse(res, 200, 'Logged in.');
            res.should.have.cookie('session.id');

            // Get /api/auth/whoami, which can only be viewed when logged in
            const whoami = await util.whoami(agent);
            whoami.should.have.status(200);
        }

        async function verifyFailedLogin(credentials) {
            const res = await util.login(credentials, agent);
            util.verifyResponse(res, 401, 'Unauthorized.');
        }

        describe('0 Valid Request', () => {
            it('SHOULD accept a valid user with a valid password', async () => {
                await util.createTestUser(agent);
                return verifySuccessfulLogin({displayname: 'user', password: 'pass'});
            });

            it('SHOULD accept a username instead of a displayname', async () => {
                await util.createTestUser(agent);
                return verifySuccessfulLogin({username: 'user', password: 'pass'});
            });

            it('SHOULD accept any non-normalized variant of a username with a valid password', async () => {
                await util.createTestInvite();
                await util.registerUser({displayname: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'pass', invite: 'code'}, agent);
                return verifySuccessfulLogin({displayname: 'BiGbIrD', password: 'pass'});
            });
        });

        describe('1 Invalid Password', () => {
            it('SHOULD NOT accept an invalid password', async () => {
                await util.createTestUser(agent);
                return verifyFailedLogin({displayname: 'user', password: 'bogus'});
            });
        });

        describe('2 Invalid User', () => {
            it('SHOULD NOT accept an invalid user', async () =>
                verifyFailedLogin({displayname: 'bogus', password: 'bogus'})
            );
        });
    });

    describe('/POST logout', () => {
        async function verifyNoSession() {
            const res = await util.whoami(agent);
            util.verifyResponse(res, 401, 'Unauthorized.');
        }

        describe('0 Valid Request', () => {
            it('must logout a user with a session', async () => {
                await util.createTestSession(agent);
                const res = await util.logout(agent);
                util.verifyResponse(res, 200, 'Logged out.');
                return verifyNoSession();
            });
        });

        describe('1 Invalid Session', () => {
            it('must not logout a user without a session', async () => {
                const res = await util.logout(agent);
                util.verifyResponse(res, 400, 'Not logged in.');
                return verifyNoSession();
            });
        });
    });

    describe('/POST whoami', () => {
        function verifyWhoami(res, username, displayname, scope, key) {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('username').equal(username);
            res.body.should.have.property('displayname').equal(displayname);
            res.body.should.have.property('scope').deep.equal(scope);
            res.body.should.have.property('key').equal(key);
        }

        describe('0 Valid Request', () => {
            it('must respond with a valid session', async () => {
                await util.createTestSession(agent);
                const res = await util.whoami(agent);
                verifyWhoami(res, 'user', 'user', ['file.upload'], null);
                return util.logout(agent);
            });

            it('must respond with a valid api key', async () => {
                await util.createTestKey(['file.upload']);
                const res = await util.whoami(agent, 'key');
                verifyWhoami(res, 'Mocha', 'Mocha', ['file.upload'], 'key');
            });
        });

        describe('1 Invalid Auth', () => {
            it('must not respond with an invalid session', async () => {
                const res = await util.whoami(agent);
                util.verifyResponse(res, 401, 'Unauthorized.');
            });

            it('must not respond with a banned user with a valid session', async () => {
                await util.createTestSession(agent);
                await util.setBanned('user', true);
                const res = await util.whoami(agent);
                util.verifyResponse(res, 403, 'Forbidden.');
            });

            it('must not respond with a banned users api key', async () => {
                await util.createTestUser(agent);
                await Promise.all([
                    util.setBanned('user', true),
                    util.insertKey({key: 'key', identifier: 'test', scope: ['file.upload'], issuer: 'user'})
                ]);
                const res = await util.whoami(agent, 'key');
                util.verifyResponse(res, 403, 'Forbidden.');
            });
        });
    });
});

describe('Uploading', () => {
    after(async () => util.clearDirectory(config.get('Upload.path')));

    describe('/POST upload', () => {
        async function verifySuccessfulUpload(file, key) {
            // Get file stats beforehand
            const fileHash = await util.fileHash(file);

            // Submit the upload and verify the result
            const res = await util.upload(file, agent, key);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('url');
            const idLength = config.get('Upload.idLength');
            res.body.should.have.property('uid').length(idLength, 'The UID should be a ' + idLength + ' letter lowercase string.');

            // Find the uploaded file in the database
            const upload = await Upload.findOne({uid: res.body.uid}, {_id: 0, uid: 1, file: 1});
            const uploadFile = upload.file.path;
            upload.should.be.a('object');
            upload.uid.should.equal(res.body.uid, 'The uploaded file in the database should exist and match the reponse ID.');

            // Verify the uploaded file is the same as the file now on disk
            const uploadHash = await util.fileHash(uploadFile);
            uploadHash.should.equal(fileHash, 'The uploaded file and the file on disk should have matching hashes.');
        }

        async function verifySuccessfulUserUpload(file, username) {
            // Get the user's stats beforehand
            const userBefore = await User.findOne({username: username}, {_id: 0, uploadCount: 1, uploadSize: 1});

            await verifySuccessfulUpload(file);

            // Verify the user's stats have been updated correctly
            const userAfter = await User.findOne({username: username}, {_id: 0, uploadCount: 1, uploadSize: 1});
            const fileSize = await util.fileSize(file);
            userAfter.uploadCount.should.equal(userBefore.uploadCount + 1, 'The users upload count should be incremented.');
            userAfter.uploadSize.should.equal(userBefore.uploadSize + fileSize, 'The users upload size should be properly increased.');
        }

        async function verifySuccessfulKeyUpload(file, key) {
            // Get the key's stats beforehand
            const keyBefore = await Key.findOne({key: key}, {_id: 0, uploadCount: 1, uploadSize: 1});

            await verifySuccessfulUpload(file, key);

            // Verify the key's stats have been updated correctly
            const keyAfter = await Key.findOne({key: key}, {_id: 0, uploadCount: 1, uploadSize: 1});
            const fileSize = await util.fileSize(file);
            keyAfter.uploadCount.should.equal(keyBefore.uploadCount + 1, 'The keys upload count should be incremented.');
            keyAfter.uploadSize.should.equal(keyBefore.uploadSize + fileSize, 'The keys upload size should be properly increased');
        }

        async function verifyFailedUpload(file, status, message, key) {
            const fileCountBefore = await util.directoryFileCount(config.get('Upload.path'));
            const uploadCountBefore = await Upload.countDocuments({});

            const res = await util.upload(file, agent, key);
            util.verifyResponse(res, status, message);

            const fileCountAfter = await util.directoryFileCount(config.get('Upload.path'));
            fileCountAfter.should.equal(fileCountBefore, 'File should not be written to disk');

            const uploadCountAfter = await Upload.countDocuments({});
            uploadCountAfter.should.equal(uploadCountBefore, 'No uploads should be written to the database');
        }

        describe('0 Valid Request', () => {
            it('SHOULD accept an upload from a valid session', async () => {
                await Promise.all([
                    util.createTestSession(agent),
                    util.createTestFile(2048, 'test.bin')
                ]);

                await verifySuccessfulUserUpload('test.bin', 'user');

                return Promise.all([
                    util.logout(agent),
                    util.deleteFile('test.bin')
                ]);
            });

            it('SHOULD accept an upload from a valid api key', async () => {
                await Promise.all([
                    util.createTestKey(['file.upload']),
                    util.createTestFile(2048, 'test.bin')
                ]);

                await verifySuccessfulKeyUpload('test.bin', 'key');

                return util.deleteFile('test.bin');
            })
        });

        describe('1 Invalid Authentication', () => {
            it('SHOULD NOT accept an unauthenticated request', async () => {
                await util.createTestFile(2048, 'test.bin');

                await verifyFailedUpload('test.bin', 401, 'Unauthorized.');

                return util.deleteFile('test.bin');
            });

            it('SHOULD NOT accept a session request without file.upload scope', async () => {
                await util.insertInvite({code: 'code', scope: [], issuer: 'Mocha'});
                await util.registerUser({displayname: 'user', password: 'pass', invite: 'code'}, agent);
                await util.login({displayname: 'user', password: 'pass'}, agent);

                await util.createTestFile(2048, 'test.bin');

                await verifyFailedUpload('test.bin', 403, 'Forbidden.');

                return Promise.all([
                    util.logout(agent),
                    util.deleteFile('test.bin')
                ]);
            });

            it('SHOULD NOT accept a key request without file.upload scope', async () => {
                await Promise.all([
                    util.createTestKey([]),
                    util.createTestFile(2048, 'test.bin')
                ]);

                await verifyFailedUpload('test.bin', 403, 'Forbidden.', 'key');

                return util.deleteFile('test.bin');
            })
        });

        describe('3 Invalid File', () => {
            before(() => util.createTestFile(config.get('Upload.maxSize') + 1024, 'large.bin'));
            after(() => util.deleteFile('large.bin'));

            it('SHOULD NOT accept a too large file', async () => {
                await util.createTestSession(agent);
                await verifyFailedUpload('large.bin', 413, 'File too large.');
                return util.logout(agent);
            });
        });

        describe('4 Malformed Request', () => {
            it('SHOULD NOT accept a request with no file attached', async () => {
                await util.createTestSession(agent);
                await verifyFailedUpload(null, 400, 'Bad request.');

                return util.logout(agent);
            });

            it('must only accept one file from a request with multiple files attached', async () => {
                await Promise.all([
                    util.createTestFile(2048, 'test1.bin'),
                    util.createTestFile(2048, 'test2.bin'),
                    util.createTestSession(agent)
                ]);


                const fileCountBefore = await util.directoryFileCount(config.get('Upload.path'));
                const uploadCountBefore = await Upload.countDocuments({});

                const res = await agent.post('/api/upload')
                    .attach('file', 'test1.bin', 'test1.bin')
                    .attach('file1', 'test2.bin', 'test2.bin');

                util.verifyResponse(res, 200, 'File uploaded.');

                const fileCountAfter = await util.directoryFileCount(config.get('Upload.path'));
                fileCountAfter.should.equal(fileCountBefore + 1, 'Only one file should be written to the disk');

                const uploadCountAfter = await Upload.countDocuments({});
                uploadCountAfter.should.equal(uploadCountBefore + 1, 'Only one upload should be written to the database');

                return Promise.all([
                    util.deleteFile('test1.bin'),
                    util.deleteFile('test2.bin')
                ]);
            })
        })
    });
});

describe('Viewing', () => {
    async function verifyView(file, uid, disposition) {
        const uploadViewsBefore = (await Upload.findOne({uid: uid})).views;
        const viewsBefore = await View.countDocuments();

        const res = await util.view(uid, agent)
            .parse(util.binaryFileParser);

        res.should.have.status(200);
        res.should.have.header('content-disposition', disposition);

        const [uploadHash, downloadHash] = await Promise.all([
            util.fileHash(file),
            util.bufferHash(res.body)
        ]);
        downloadHash.should.equal(uploadHash, 'Uploaded file and downloaded hash should match');

        const viewsAfter = await View.countDocuments();
        const uploadViewsAfter = (await Upload.findOne({uid: uid})).views;
        uploadViewsAfter.should.equal(uploadViewsBefore + 1, 'The files views should be incremented.');
        viewsAfter.should.equal(viewsBefore + 1, 'A view object should have been inserted to the database.');
    }

    it('must return an uploaded binary file', async () => {
        await Promise.all([
            util.createTestSession(agent),
            util.createTestFile(2048, 'test.bin')
        ]);
        const upload = await util.upload('test.bin', agent);
        await verifyView('test.bin', upload.body.uid, 'attachment; filename="test.bin"');
        return util.deleteFile('test.bin');
    });

    it('must return an uploaded image file inline', async () => {
        await Promise.all([
            util.createTestSession(agent),
            util.createTestFile(2048, 'test.jpg')
        ]);
        const upload = await util.upload('test.jpg', agent);
        await verifyView('test.jpg', upload.body.uid, 'inline');
        return util.deleteFile('test.jpg');
    });

    it('must return an error when file not found', async () => {
        const res = await util.view('abcdef', agent);
        util.verifyResponse(res, 404, 'File not found.');
    });
});

describe('Invites', () => {
    describe('/POST create', () => {
        async function verifyCreatedInvite(invite) {
            const res = await util.createInvite(invite, agent);
            util.verifyResponse(res, 200, 'Invite created.');
            res.body.should.have.property('code').match(/^[A-Fa-f0-9]+$/, 'The invite should be a hex string.');

            const dbInvite = await Invite.findOne({code: res.body.code});
            dbInvite.should.not.equal(null);
            dbInvite.scope.should.deep.equal(invite.scope, 'The created invites scope should match the request.');
            dbInvite.issuer.should.equal('user');
        }

        describe('0 Valid Request', () => {
            it('SHOULD create an invite with valid scope from a valid session', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload']);
                return verifyCreatedInvite({scope: ['file.upload']});
            });
        });

        describe('1 Invalid Scope', () => {
            it('SHOULD NOT create in invite without invite.create scope', async () => {
                await util.createSession(agent, ['file.upload']);
                const res = await util.createInvite({scope: ['file.upload']}, agent);
                util.verifyResponse(res, 403, 'Forbidden.');
            });

            it('SHOULD NOT create an invite with a scope exceeding the requesters', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload']);
                const res = await util.createInvite({scope: ['user.ban']}, agent);
                util.verifyResponse(res, 403, 'Requested scope exceeds own scope.');
            });
        });
    });

    describe('/POST delete', () => {
        async function verifyDeletedInvite(code) {
            const res = await util.deleteInvite(code, agent);
            util.verifyResponse(res, 200, 'Invite deleted.');

            const inviteCount = await Invite.countDocuments({code: code});
            inviteCount.should.equal(0, 'The invite should be removed from the database.');
        }

        describe('0 Valid Request', () => {
            it('SHOULD delete an invite with valid permission from a valid session', async () => {
                await util.createSession(agent, ['invite.create', 'invite.delete', 'file.upload']);
                const res = await util.createInvite({scope: ['file.upload']}, agent);
                return verifyDeletedInvite(res.body.code);
            });

            it('SHOULD delete another users invite with invite.delete.others scope', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload'], 'alice');
                const invite = await util.createInvite({scope: ['file.upload']}, agent);
                await util.logout(agent);

                await util.createSession(agent, ['invite.create', 'invite.delete', 'invite.delete.others'], 'eve');
                return verifyDeletedInvite(invite.body.code);
            });

            it('SHOULD delete a usedinvite with invite.delete.used scope', async () => {
                await util.createSession(agent, ['invite.create', 'invite.delete', 'invite.delete.used', 'file.upload'], 'alice');
                const invite = await util.createInvite({scope: ['file.upload']}, agent);
                await util.registerUser({displayname: 'bob', password: 'hunter2', invite: invite.body.code}, agent);

                return verifyDeletedInvite(invite.body.code);
            });
        });

        describe('1 Invalid Scope', () => {
            it('SHOULD NOT delete an invite without invite.delete scope', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload']);
                const invite = await util.createInvite({scope: ['file.upload']}, agent);
                const res = await util.deleteInvite(invite.body.code, agent);
                util.verifyResponse(res, 403, 'Forbidden.');
            });

            it('SHOULD NOT delete another users invite without invite.delete.others scope', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload'], 'alice');
                const invite = await util.createInvite({scope: ['file.upload']}, agent);
                await util.logout(agent);

                await util.createSession(agent, ['invite.create', 'invite.delete'], 'eve');
                const res = await util.deleteInvite(invite.body.code, agent);
                util.verifyResponse(res, 422, 'Invite not found.');
            });

            it('SHOULD NOT delete a used invite without invite.delete.used scope', async () => {
                await util.createSession(agent, ['invite.create', 'invite.delete', 'file.upload'], 'alice');
                const invite = await util.createInvite({scope: ['file.upload']}, agent);

                await util.registerUser({displayname: 'bob', password: 'hunter2', invite: invite.body.code}, agent);

                const res = await util.deleteInvite(invite.body.code, agent);
                util.verifyResponse(res, 403, 'Forbidden to delete used invites.');
            });
        });

        describe('2 Invalid Code', () => {
            it('SHOULD return an error when the invite is not found', async () => {
                await util.createSession(agent, ['invite.delete']);
                const res = await util.deleteInvite('bogus', agent);
                util.verifyResponse(res, 422, 'Invite not found.');
            });
        });
    });

    describe('/POST get', () => {
        async function verifyInviteSearch(codes) {
            const res = await util.getInvites({}, agent);
            res.should.have.status(200);
            res.body.should.be.a('Array');

            codes.sort();
            const resCodes = res.body.map(invite => invite.code).sort();

            resCodes.should.deep.equal(codes, 'All invites should be present in result.');
        }

        async function verifySingleSearch(code) {
            const res = await util.getInvites({code: code}, agent);
            res.should.have.status(200);
            res.body.should.be.a('Array');
            res.body.should.have.length(1, 'Only one invite should be in the array');
            res.body[0].code.should.equal(code, 'The found invite should match the request code');
        }

        describe('0 Valid Request', () => {
            it('SHOULD get multiple invites from a valid session', async () => {
                await util.createSession(agent, ['invite.create', 'invite.get', 'file.upload']);
                const inv1 = await util.createInvite({scope: ['file.upload']}, agent);
                const inv2 = await util.createInvite({scope: ['invite.create']}, agent);

                return verifyInviteSearch([inv1.body.code, inv2.body.code]);
            });

            it('SHOULD get a single invite from a valid session', async () => {
                await util.createSession(agent, ['invite.create', 'invite.get', 'file.upload']);
                const inv = await util.createInvite({scope: ['file.upload']}, agent);

                return verifySingleSearch(inv.body.code);
            });

            it('SHOULD get another users invite with invite.get.others scope', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload'], 'alice');
                const inv = await util.createInvite({scope: ['file.upload']}, agent);
                await util.logout(agent);

                await util.createSession(agent, ['invite.get', 'invite.get.others'], 'eve');
                return verifySingleSearch(inv.body.code);
            });
        });

        describe('1 Invalid Scope', () => {
            it('SHOULD NOT get invites without invite.get scope', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload']);
                const res = await util.getInvites({code: 'bogus'}, agent);
                util.verifyResponse(res, 403, 'Forbidden.');
            });

            it('SHOULD NOT get another users invite without invite.get.others scope', async () => {
                await util.createSession(agent, ['invite.create', 'file.upload'], 'alice');
                const invite = await util.createInvite({scope: ['file.upload']}, agent);
                await util.logout(agent);

                await util.createSession(agent, ['invite.get'], 'eve');
                const res = await util.getInvites({code: invite.body.code}, agent);
                res.should.have.status(200);
                res.body.should.be.a('Array');
                res.body.should.have.length(0, 'No invites should be found.');
            });
        });
    });
});

describe('Keys', () => {
    describe('/POST create', () => {
        async function verifyCreatedKey(key) {
            const res = await util.createKey(key, agent);
            util.verifyResponse(res, 200, 'Key created.');
            res.body.should.have.property('key').match(/^[A-Fa-f0-9]+$/, 'The key should be a hex string');

            const dbKey = await Key.findOne({key: res.body.key});
            dbKey.should.not.equal(null);
            dbKey.scope.should.deep.equal(key.scope, 'The created keys scope should match the request.');
            dbKey.issuer.should.equal('user');
        }

        describe('0 Valid Request', () => {
            it('SHOULD create a key with valid scope from a valid session', async () => {
                await util.createSession(agent, ['key.create', 'file.upload']);
                return verifyCreatedKey({identifier: 'key', scope: ['file.upload']});
            });
        });

        describe('1 Invalid Scope', () => {
            it('SHOULD NOT create a key without key.create scope', async () => {
                await util.createSession(agent, ['file.upload']);
                const res = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                util.verifyResponse(res, 403, 'Forbidden.');
            });

            it('SHOULD NOT create a key with scope exceeding the requesters', async () => {
                await util.createSession(agent, ['key.create']);
                const res = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                util.verifyResponse(res, 403, 'Requested scope exceeds own scope.');
            });
        });

        describe('2 Key Limit', () => {
            it('must not create additional keys beyond the limit', async () => {
                await util.createSession(agent, ['key.create', 'file.upload']);
                const limit = config.get('Key.limit');

                // Create keys upto the limit (key0, key1, key2, ...)
                await Promise.all(
                    [...Array(limit)]
                        .map(idx => util.createKey({identifier: 'key' + idx, scope: ['file.upload']}, agent)));

                const res = await util.createKey({identifier: 'toomany', scope: ['file.upload']}, agent);
                util.verifyResponse(res, 403, 'Key limit reached.');
            });
        });
    });

    describe('/POST delete', () => {
        async function verifyDeletedKey(key) {
            const res = await util.deleteKey(key, agent);
            util.verifyResponse(res, 200, 'Key deleted.');

            const keyCount = await Key.countDocuments({key: key});
            keyCount.should.equal(0, 'The key should be removed from the database.');
        }


        describe('0 Valid Request', () => {
            it('SHOULD delete a key with valid scope from a valid session', async () => {
                await util.createSession(agent, ['key.create', 'key.delete', 'file.upload']);
                const key = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                return verifyDeletedKey(key.body.key);
            });

            it('SHOULD delete another users key with key.delete.others scope', async () => {
                await util.createSession(agent, ['key.create', 'file.upload'], 'alice');
                const key = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                await util.logout(agent);
                await util.createSession(agent, ['key.delete', 'key.delete.others'], 'eve');
                return verifyDeletedKey(key.body.key);
            });
        });

        describe('1 Invalid Scope', () => {
            it('SHOULD NOT delete another users key without key.delete.others scope', async () => {
                await util.createSession(agent, ['key.create', 'file.upload'], 'bob');
                const key = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                await util.logout(agent);
                await util.createSession(agent, ['key.delete'], 'eve');
                const res = await util.deleteKey(key.body.key, agent);
                util.verifyResponse(res, 422, 'Key not found.');
            });
        });

        describe('2 Invalid Key', () => {
            it('SHOULD return an error when the key was not found', async () => {
                await util.createSession(agent, ['key.delete']);
                const res = await util.deleteKey('bogus', agent);
                util.verifyResponse(res, 422, 'Key not found.');
            });
        });
    });

    describe('/POST get', () => {
        async function verifyKeySearch(keys, query = {}) {
            const res = await util.getKeys(query, agent);
            res.should.have.status(200);
            res.body.should.be.a('Array');

            keys.sort();
            const resKeys = res.body.map(key => key.key).sort();

            resKeys.should.deep.equal(keys, 'All keys should be present in the result.');
        }

        async function verifySingleSearch(key, query = {}) {
            const res = await util.getKeys(query, agent);
            res.should.have.status(200);
            res.body.should.be.a('Array');
            res.body.should.have.length(1, 'Only one key should be in the array');
            res.body[0].key.should.equal(key, 'The found key should match the request code');
        }

        describe('0 Valid Request', () => {
            it('SHOULD get multiple keys from a valid session', async () => {
                await util.createSession(agent, ['key.create', 'key.get', 'file.upload']);
                const keys = await Promise.all([
                    util.createKey({identifier: 'key1', scope: ['file.upload']}, agent),
                    util.createKey({identifier: 'key2', scope: ['file.upload']}, agent)
                ]);
                return verifyKeySearch(keys.map(res => res.body.key));
            });

            it('SHOULD get a key by identifier from a valid session', async () => {
                await util.createSession(agent, ['key.create', 'key.get', 'file.upload']);
                const keys = await Promise.all([
                    util.createKey({identifier: 'key1', scope: ['file.upload']}, agent),
                    util.createKey({identifier: 'key2', scope: ['file.upload']}, agent)
                ]);
                return verifySingleSearch(keys[1].body.key, {identifier: 'key2'});
            });

            it('SHOULD get another users key with key.get.others scope', async () => {
                await util.createSession(agent, ['key.create', 'file.upload'], 'bob');
                const key1 = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                await util.logout(agent);
                await util.createSession(agent, ['key.create', 'key.get', 'key.get.others', 'file.upload']);
                const key2 = await util.createKey({identifier: 'key', scope: ['file.upload']}, agent);
                return verifyKeySearch([key1.body.key, key2.body.key]);
            });
        });

        describe('1 Invalid Scope', () => {
            it('SHOULD NOT get another users key without key.get.others scope', async () => {
                await util.createSession(agent, ['key.create', 'file.upload'], 'alice');
                await util.createInvite({identifier: 'private_key', scope: ['file.upload']}, agent);
                await util.logout(agent);

                await util.createSession(agent, ['key.get'], 'eve');
                const res = await util.getKeys({identifier: 'private_key'}, agent);
                res.should.have.status(200);
                res.body.should.be.a('Array');
                res.body.should.have.length(0, 'No invites should be found.');
            });
        });
    });
});

describe('Users', () => {
    describe('/GET get', () => {
        beforeEach(() => Promise.all([
            Promise.all([
                util.insertInvite({code: 'test1', scope: ['file.upload'], issuer: 'Mocha'}),
                util.insertInvite({code: 'test2', scope: ['file.upload'], issuer: 'Mocha'})
            ]),
            Promise.all([
                util.registerUser({displayname: 'user1', password: 'pass', invite: 'test1'}, agent),
                util.registerUser({displayname: 'user2', password: 'pass', invite: 'test2'}, agent)
            ])
        ]));

        async function verifyGetUsers(res, users) {
            res.should.have.status(200);
            res.body.should.be.a('Array');
            res.body.map(user => user.username).sort().should.deep.equal(users.sort());
        }

        describe('0 Valid Request', () => {
            it('must get all users with an empty query', async () => {
                await util.createSession(agent, ['user.get'], 'admin');
                const res = await util.getUsers({}, agent);
                return verifyGetUsers(res, ['user1', 'user2', 'admin']);
            });

            it('must filter users by username', async () => {
                await util.createSession(agent, ['user.get'], 'admin');
                const res = await util.getUsers({username: 'user1'}, agent);
                return verifyGetUsers(res, ['user1']);
            });

            it('must filter users by displayname', async () => {
                await util.createSession(agent, ['user.get'], 'admin');
                const res = await util.getUsers({displayname: 'user1'}, agent);
                return verifyGetUsers(res, ['user1']);
            });

            it('must return an empty array when no users were found', async () => {
                await util.createSession(agent, ['user.get'], 'admin');
                const res = await util.getUsers({username: 'abc'}, agent);
                return verifyGetUsers(res, []);
            });
        });
    });

    describe('/POST ban/unban', () => {
        beforeEach(async () => {
            await util.insertInvite({code: 'test1', scope: ['file.upload'], issuer: 'Mocha'});
            await util.registerUser({displayname: 'user', password: 'pass', invite: 'test1'}, agent);
        });

        async function verifyBanned(res, statusCode, message, username, banStatus) {
            util.verifyResponse(res, statusCode, message);
            const user = await User.findOne({username: username});
            user.should.exist;
            user.should.have.property('banned').equal(banStatus, 'The user should have banned status ' + banStatus);
        }

        describe('0 Valid Request', () => {
            it('must ban a not banned user', async () => {
                await util.createSession(agent, ['user.ban'], 'admin');
                const res = await util.ban('user', agent);
                return verifyBanned(res, 200, 'User banned.', 'user', true);
            });

            it('must unban a banned user', async () => {
                await util.setBanned('user', true);
                await util.createSession(agent, ['user.unban'], 'admin');
                const res = await util.unban('user', agent);
                return verifyBanned(res, 200, 'User unbanned.', 'user', false);
            });
        });

        describe('1 Already Requested Ban Status', () => {
            it('must not ban an already banned user', async () => {
                await util.setBanned('user', true);
                await util.createSession(agent, ['user.ban'], 'admin');
                const res = await util.ban('user', agent);
                return verifyBanned(res, 422, 'User already banned.', 'user', true);
            });

            it('must not unban a not banned user', async () => {
                await util.createSession(agent, ['user.unban'], 'admin');
                const res = await util.unban('user', agent);
                return verifyBanned(res, 422, 'User not banned.', 'user', false);
            });
        });

        describe('2 Not Found', () => {
            it('must not ban a nonexistant user', async () => {
                await util.createSession(agent, ['user.ban'], 'admin');
                const res = await util.ban('abc', agent);
                util.verifyResponse(res, 422, 'User not found.');
            });

            it('must not unban a nonexistant user', async () => {
                await util.createSession(agent, ['user.unban'], 'admin');
                const res = await util.unban('abc', agent);
                util.verifyResponse(res, 422, 'User not found.');
            });
        });
    });
});

describe('Stats', () => {
    describe('/GET uploads', () => {
        describe('0 Valid Request', () => {
            const currentDate = new Date();
            const oneDay = 1000 * 60 * 60 * 24;

            it('must return valid upload stats', async () => {
                await Promise.all([
                    util.insertUpload({
                        uid: 'uvwxyz',
                        uploader: 'user',
                        date: new Date(currentDate - 3 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    }), util.insertUpload({
                        uid: 'abcdef',
                        uploader: 'user',
                        date: new Date(currentDate - 3 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    })
                ]);

                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsUploads({}, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(2, 'There should be exactly two uploads returned');

                const stat = stats[0];
                stat.should.have.property('date');
                stat.should.have.property('uid');
                stat.should.have.property('key');
                stat.should.have.property('originalName');
                stat.should.have.property('size');
                stat.should.have.property('mime');

                return util.logout(agent);
            });

            it('must return an empty set when there are no stats', async () => {
                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsUploads({}, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(0, 'No uploads should be returned');
            });

            it('must constrain results by date', async () => {
                await Promise.all([
                    util.insertUpload({
                        uid: 'uvwxyz',
                        uploader: 'user',
                        date: new Date(currentDate - 8 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    }), util.insertUpload({
                        uid: 'lmnopq',
                        uploader: 'user',
                        date: new Date(currentDate - 6 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    }), util.insertUpload({
                        uid: 'abcdef',
                        uploader: 'user',
                        date: new Date(currentDate - 4 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    })
                ]);

                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsUploads({
                    before: new Date(currentDate - 5 * oneDay),
                    after: new Date(currentDate - 7 * oneDay)
                }, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(1, 'There should be exactly one upload returned');

                return util.logout(agent);
            });

            it('must limit results', async () => {
                await Promise.all([
                    util.insertUpload({
                        uid: 'uvwxyz',
                        uploader: 'user',
                        date: new Date(currentDate - 3 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    }), util.insertUpload({
                        uid: 'abcdef',
                        uploader: 'user',
                        date: new Date(currentDate - 3 * oneDay),
                        file: {
                            originalName: 'lol.png',
                            size: 1,
                            mime: 'image/png'
                        }
                    })
                ]);

                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsUploads({limit: 1}, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(1, 'There should be exactly one upload returned');

                return util.logout(agent);
            });
        });
    });

    describe('/GET views', () => {
        describe('0 Valid Request', () => {
            const currentDate = new Date();
            const oneDay = 1000 * 60 * 60 * 24;

            it('must return valid view stats', async () => {
                await Promise.all([
                    util.insertView({
                        uid: 'abcdef',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 3 * oneDay),
                    }), util.insertView({
                        uid: 'uvwxyz',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 3 * oneDay),
                    })
                ]);

                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsViews({}, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(2, 'There should be exactly two views returned');

                const stat = stats[0];
                stat.should.have.property('date');
                stat.should.have.property('uid');
                stat.should.not.have.property('remoteAddress');
                stat.should.not.have.property('userAgent');

                return util.logout(agent);
            });

            it('must return an empty set when there are no stats', async () => {
                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsViews({}, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(0, 'No views should be returned');
            });

            it('must constrain results by date', async () => {
                await Promise.all([
                    util.insertView({
                        uid: 'abcdef',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 8 * oneDay),
                    }), util.insertView({
                        uid: 'uvwxyz',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 6 * oneDay),
                    }), util.insertView({
                        uid: 'lmnopq',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 4 * oneDay),
                    })
                ]);

                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsViews({
                    before: new Date(currentDate - 5 * oneDay),
                    after: new Date(currentDate - 7 * oneDay)
                }, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(1, 'There should be exactly one view returned');

                return util.logout(agent);
            });

            it('must limit results', async () => {
                await Promise.all([
                    util.insertView({
                        uid: 'abcdef',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 3 * oneDay),
                    }), util.insertView({
                        uid: 'uvwxyz',
                        uploader: 'user',
                        remoteAddress: '::1',
                        userAgent: 'fiyerfocks',
                        date: new Date(currentDate - 3 * oneDay),
                    })
                ]);

                await util.createSession(agent, ['stats.get'], 'user');

                const res = await util.getStatsViews({limit: 1}, agent);
                res.should.have.status(200);

                const stats = res.body;
                stats.should.be.a('Array');
                stats.should.have.length(1, 'There should be exactly one view returned');

                return util.logout(agent);
            });
        });
    });
});

after(() => server.close(() => process.exit(0)));
