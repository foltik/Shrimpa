process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();

const ModelPath = '../app/models/';
const User = require(ModelPath + 'User.js');
const Upload = require(ModelPath + 'Upload.js');
const Key = require(ModelPath + 'Key.js');
const Invite = require(ModelPath + 'Invite.js');

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

describe('Authentication', function() {
    beforeEach(async () => util.clearDatabase());

    describe('/POST register', () => {
        describe('0 Valid Request', () => {
            async function verifySuccessfulRegister(user) {
                await util.createTestInvite();

                const res = await util.registerUser(user, agent);

                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql('Registration successful.');

                const userCount = await User.countDocuments({displayname: user.displayname});
                userCount.should.equal(1);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.displayname)});
                inviteCount.should.equal(1);
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

                const res = await(util.registerUser(user, agent));
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql(message);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.displayname)});
                inviteCount.should.equal(0);
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
            async function verifyRejectedUsername(user, message) {
                const res = await util.registerUser(user, agent);
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('message').equal(message);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.displayname)});
                inviteCount.should.equal(0);
            }

            it('MUST NOT register a duplicate username', async () => {
                await util.createTestInvites(2);
                const user0 = {displayname: 'user', password: 'pass', invite: 'code0'};
                const user1 = {displayname: 'user', password: 'diff', invite: 'code1'};

                await util.registerUser(user0, agent);
                return verifyRejectedUsername(user1, 'Username in use.');
            });

            it('MUST NOT register a username with a duplicate canonical name', async () => {
                await util.createTestInvites(2);
                const user0 = {displayname: 'bigbird', password: 'pass', invite: 'code0'};
                const user1 = {displayname: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'diff', invite: 'code1'};

                await util.registerUser(user0, agent);
                return verifyRejectedUsername(user1, 'Username in use.');
            });

            it('MUST NOT register a username containing whitespace', async () => {
                await util.createTestInvites(3);
                const users = [
                    {displayname: 'user name', password: 'pass', invite: 'code0'},
                    {displayname: 'user　name', password: 'pass', invite: 'code1'},
                    {displayname: 'user name', password: 'pass', invite: 'code2'}
                ];

                const failMsg = 'Username contains invalid characters.';
                return Promise.all(users.map(user => verifyRejectedUsername(user, failMsg)));
            });

            it('MUST NOT register a username containing HTML', async () => {
                await util.createTestInvite();
                const user = {displayname: 'user<svg/onload=alert("XSS")>', password: 'pass', invite: 'code'};
                return verifyRejectedUsername(user, 'Username contains invalid characters.');
            });

            it('MUST NOT register a username with too many characters', async () => {
                await util.createTestInvite();
                const user = {displayname: '123456789_123456789_123456789_1234567', password: 'pass', invite: 'code'};
                return verifyRejectedUsername(user, 'Username too long.');
            })
        });
    });

    describe('/POST login', () => {
        async function verifySuccessfulLogin(credentials) {
            const res = await util.login(credentials, agent);
            res.should.have.status(200);
            res.body.should.have.property('message').equal('Logged in.');
            res.should.have.cookie('session.id');

            const whoami = await util.whoami(agent);
            whoami.should.have.status(200);
        }

        async function verifyFailedLogin(credentials) {
            const res = await util.login(credentials, agent);
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('message').equal('Unauthorized.');
        }

        describe('0 Valid Request', () => {
            it('SHOULD accept a valid user with a valid password', async () => {
                await util.createTestUser(agent);
                return verifySuccessfulLogin({displayname: 'user', password: 'pass'});
            });

            it('SHOULD accept any non-normalized variant of a username with a valid password', async () => {

            })
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
});

describe('Uploading', () => {
    beforeEach(async () => util.clearDatabase());

    describe('/POST upload', () => {
        async function verifySuccessfulUpload(file, key) {
            // Get file stats beforehand
            const [fileHash, fileSize] = await Promise.all([util.fileHash(file), util.fileSize(file)]);

            // Submit the upload and verify the result
            const res = await util.upload(file, agent, key);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('url');
            res.body.should.have.property('id').match(/^[a-z]{6}$/);

            // Find the uploaded file in the database
            const upload = await Upload.findOne({id: res.body.id}, {_id: 0, id: 1, file: 1});
            const uploadFile = upload.file.path;
            upload.should.be.a('object');
            upload.id.should.equal(res.body.id);

            // Verify the uploaded file is the same as the file now on disk
            const [uploadHash, uploadSize] = await Promise.all([util.fileHash(uploadFile), util.fileSize(uploadFile)]);
            uploadHash.should.equal(fileHash);
            uploadSize.should.equal(fileSize);

            return fileSize;
        }

        async function verifySuccessfulUserUpload(file, username) {
            // Get the user's stats beforehand
            const userBefore = await User.findOne({username: username}, {_id: 0, uploadCount: 1, uploadSize: 1});

            const fileSize = await verifySuccessfulUpload(file);

            // Verify the user's stats have been updated correctly
            const userAfter = await User.findOne({username: username}, {_id: 0, uploadCount: 1, uploadSize: 1});
            userAfter.uploadCount.should.equal(userBefore.uploadCount + 1);
            userAfter.uploadSize.should.equal(userBefore.uploadSize + fileSize);
        }

        async function verifySuccessfulKeyUpload(file, key) {
            // Get the key's stats beforehand
            const keyBefore = await Key.findOne({key: key}, {_id: 0, uploadCount: 1, uploadSize: 1});

            const fileSize = await verifySuccessfulUpload(file, key);

            // Verify the key's stats have been updated correctly
            const keyAfter = await Key.findOne({key: key}, {_id: 0, uploadCount: 1, uploadSize: 1});
            keyAfter.uploadCount.should.equal(keyBefore.uploadCount + 1);
            keyAfter.uploadSize.should.equal(keyBefore.uploadSize + fileSize);
        }

        async function verifyFailedUpload(file, status, message, key) {
            const fileCountBefore = await util.directoryFileCount(config.get('Upload.path'));
            const uploadCountBefore = await Upload.countDocuments({});

            const res = await util.upload(file, agent, key);
            res.should.have.status(status);
            res.body.should.be.a('object');
            res.body.should.have.property('message').equal(message);

            const fileCountAfter = await util.directoryFileCount(config.get('Upload.path'));
            fileCountAfter.should.equal(fileCountBefore, 'File should not have been written to disk');

            const uploadCountAfter = await Upload.countDocuments({});
            uploadCountAfter.should.equal(uploadCountBefore, 'No uploads should have been written to the database');
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

                await verifyFailedUpload(null, 401, 'Unauthorized.');

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
            it('SHOULD NOT accept a too large file', async () => {
                await Promise.all([
                    util.createTestSession(agent),
                    util.createTestFile(config.get('Upload.maxSize') + 1, 'large.bin')
                ]);

                await verifyFailedUpload('large.bin', 413, 'File too large.');

                return Promise.all([
                    util.logout(agent),
                    util.deleteFile('large.bin')
                ]);
            });
        });

        describe('4 Invalid Request', () => {
            it('SHOULD NOT accept a request with no file attached', async () => {
                await util.createTestSession(agent);
                await verifyFailedUpload(null, 400, 'No file specified.');

                return util.logout(agent);
            });
        })
    });
});

describe('Invites', () => {
    beforeEach(async () => util.clearDatabase());

    async function verifyCreatedInvite(invite) {
        const res = await util.createInvite(invite, agent);
        util.verifyResponse(res, 200, 'Invite created.');
        res.body.should.have.property('code').match(/^[A-Fa-f0-9]+$/);

        const dbInvite = await Invite.findOne({code: res.body.code});
        dbInvite.should.not.equal(null);
        dbInvite.scope.should.deep.equal(invite.scope);
        dbInvite.issuer.should.equal('user');
    }

    async function verifyDeletedInvite(code) {
        const res = await util.deleteInvite(code, agent);
        util.verifyResponse(res, 200, 'Invite deleted.');

        const inviteCount = await Invite.countDocuments({code: code});
        inviteCount.should.equal(0, 'The invite should have been removed from the database');
    }

    async function verifyInviteSearch(codes) {
        const res = await util.getInvites({}, agent);
        res.should.have.status(200);
        res.body.should.be.a('Array');

        codes.sort();
        const resCodes = res.body.map(invite => invite.code).sort();

        resCodes.should.deep.equal(codes, 'All invites should be present in result');
    }

    async function verifySingleSearch(code) {
        const res = await util.getInvites({code: code}, agent);
        res.should.have.status(200);
        res.body.should.be.a('Array');
        res.body.should.have.length(1);
        res.body[0].code.should.equal(code);
    }

    describe('/POST create', () => {
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

        describe('2 Malformed Request', () => {
            it('SHOULD return an error when scope is not specified.', async () => {
                await util.createSession(agent, ['invite.create']);
                const res = await util.createInvite(null, agent);
                util.verifyResponse(res, 400, 'scope not specified.');
            });

            it('SHOULD return an error when scope is not an array', async () => {
                await util.createSession(agent, ['invite.create']);
                const res = await util.createInvite({scope: {broken: 'object'}}, agent);
                util.verifyResponse(res, 400, 'scope malformed.');
            });
        })
    });

    describe('/POST delete', () => {
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
                util.verifyResponse(res, 404, 'Invite not found.');
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
                util.verifyResponse(res, 404, 'Invite not found.');
            });
        });

        describe('3 Malformed Request', () => {
            it('SHOULD return an error when no code was specified', async () => {
                await util.createSession(agent, ['invite.delete']);
                const res = await util.deleteInvite(null, agent);
                util.verifyResponse(res, 400, 'code not specified.');
            });

            it('SHOULD return an error when the code is not a string', async () => {
                await util.createSession(agent, ['invite.delete']);
                const res = await util.deleteInvite({break: 'everything'}, agent);
                util.verifyResponse(res, 400, 'code malformed.');
            });
        });
    });

    describe('/POST get', () => {
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
                res.body.should.have.length(0);
            });
        });

        describe('2 Malformed Request', () => {
            it('SHOULD return an error when code is not a string', async () => {
                await util.createSession(agent, ['invite.get']);
                const res = await util.getInvites({code: {what: 'even'}}, agent);
                util.verifyResponse(res, 400, 'code malformed.');
            });
        });
    });
});

after(() => server.close(() => process.exit(0)));
