process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();

const User = require('../app/models/User.js');
const Invite = require('../app/models/Invite.js');
const Upload = require('../app/models/Upload.js');
const Key = require('../app/models/Key.js');

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

describe('Accounts', function() {
    beforeEach(async () => util.clearDatabase());

    describe('/POST register', () => {
        describe('0 Valid Request', () => {
            async function verifySuccessfulRegister(user) {
                await util.createTestInvite();

                const res = await util.registerUser(user, agent);

                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql('Registration successful.');

                const userCount = await User.countDocuments({username: user.username});
                userCount.should.equal(1);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.username)});
                inviteCount.should.equal(1);
            }

            it('MUST register a valid user with a valid invite', async () =>
                verifySuccessfulRegister({username: 'user', password: 'pass', invite: 'code'})
            );

            it('MUST register a username with unicode symbols and a valid invite', async () =>
                verifySuccessfulRegister({username: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'pass', invite: 'code'})
            );
        });


        describe('1 Invalid Invites', () => {
            async function verifyRejectedInvite(invite, message) {
                const user = {username: 'user', password: 'pass', invite: 'code'};
                if (invite) {
                    await util.createInvite(invite, agent);
                    user.invite = invite.code;
                }

                const res = await(util.registerUser(user, agent));
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql(message);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.username)});
                inviteCount.should.equal(0);
            }

            it('MUST NOT register a nonexistant invite', async () =>
                verifyRejectedInvite(null, 'Invalid invite code.')
            );

            it('MUST NOT register a used invite', async () =>
                verifyRejectedInvite({code: 'code', used: new Date()}, 'Invite already used.')
            );

            it('MUST NOT register an expired invite', async () =>
                verifyRejectedInvite({code: 'code', exp: new Date()}, 'Invite expired.')
            );
        });


        describe('2 Invalid Usernames', () => {
            async function verifyRejectedUsername(user, message) {
                const res = await util.registerUser(user, agent);
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('message').equal(message);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.username)});
                inviteCount.should.equal(0);
            }

            it('MUST NOT register a duplicate username', async () => {
                await util.createTestInvites(2);
                const user0 = {username: 'user', password: 'pass', invite: 'code0'};
                const user1 = {username: 'user', password: 'diff', invite: 'code1'};

                await util.registerUser(user0, agent);
                return verifyRejectedUsername(user1, 'Username in use.');
            });

            it('MUST NOT register a username with a duplicate canonical name', async () => {
                await util.createTestInvites(2);
                const user0 = {username: 'bigbird', password: 'pass', invite: 'code0'};
                const user1 = {username: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'diff', invite: 'code1'};

                await util.registerUser(user0, agent);
                return verifyRejectedUsername(user1, 'Username in use.');
            });

            it('MUST NOT register a username containing whitespace', async () => {
                await util.createTestInvites(3);
                const users = [
                    {username: 'user name', password: 'pass', invite: 'code0'},
                    {username: 'user　name', password: 'pass', invite: 'code1'},
                    {username: 'user name', password: 'pass', invite: 'code2'}
                ];

                const failMsg = 'Username contains invalid characters.';
                return Promise.all(users.map(user => verifyRejectedUsername(user, failMsg)));
            });

            it('MUST NOT register a username containing HTML', async () => {
                await util.createTestInvite();
                const user = {username: 'user<svg/onload=alert("XSS")>', password: 'pass', invite: 'code'};
                return verifyRejectedUsername(user, 'Username contains invalid characters.');
            });

            it('MUST NOT register a username with too many characters', async () => {
                await util.createTestInvite();
                const user = {username: '123456789_123456789_123456789_1234567', password: 'pass', invite: 'code'};
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
                return verifySuccessfulLogin({username: 'user', password: 'pass'});
            });

            it('SHOULD accept any non-normalized variant of a username with a valid password', async () => {
                await util.create
            })
        });


        describe('1 Invalid Password', () => {
            it('SHOULD NOT accept an invalid password', async () => {
                await util.createTestUser(agent);
                return verifyFailedLogin({username: 'user', password: 'bogus'});
            });
        });

        describe('2 Invalid User', () => {
            it('SHOULD NOT accept an invalid user', async () =>
                verifyFailedLogin({username: 'bogus', password: 'bogus'})
            );
        });
    });
});

describe('Uploads', () => {
    beforeEach(async () => util.clearDatabase());

    describe('/POST upload', () => {
        async function verifySuccessfulUpload(file, user) {
            // Get file stats beforehand
            const [fileHash, fileSize] = await Promise.all([util.fileHash(file), util.fileSize(file)]);

            // Get the user stats beforehand
            const userBefore = await User.findOne({canonicalname: user}, {_id: 0, uploadCount: 1, uploadSize: 1});

            // Submit the upload and verify the result
            const res = await util.upload(file, agent);
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

            // Verify the user's stats have been updated correctly
            const userAfter = await User.findOne({canonicalname: user}, {_id: 0, uploadCount: 1, uploadSize: 1});
            userAfter.uploadCount.should.equal(userBefore.uploadCount + 1);
            userAfter.uploadSize.should.equal(userBefore.uploadSize + fileSize);
        }

        async function verifyFailedUpload(file, status, message) {
            const fileCountBefore = await util.directoryFileCount(config.get('Upload.path'));
            const uploadCountBefore = await Upload.countDocuments({});

            const res = await util.upload(file, agent);
            res.should.have.status(status);
            res.body.should.be.a('object');
            res.body.should.have.property('message').equal(message);

            const fileCountAfter = await util.directoryFileCount(config.get('Upload.path'));
            fileCountAfter.should.equal(fileCountBefore, 'File should not have been written to disk');

            const uploadCountAfter = await Upload.countDocuments({});
            uploadCountAfter.should.equal(uploadCountBefore, 'No uploads should have been written to the database');
        }

        describe('0 Valid Request', () => {
            it('SHOULD accept logged in valid upload', async () => {
                await Promise.all([
                    util.createTestSession(agent),
                    util.createTestFile(2048, 'test.bin')
                ]);

                await verifySuccessfulUpload('test.bin', 'user');

                return Promise.all([
                    util.logout(agent),
                    util.deleteFile('test.bin')
                ]);
            });
        });

        describe('1 Invalid Authentication', () => {
            it('SHOULD NOT accept an unauthenticated request', async () =>
                verifyFailedUpload(null, 401, 'Unauthorized.')
            );

            it('SHOULD NOT accept a request without file.upload scope', async () => {
                await util.createInvite({code: 'code', scope: []});
                await util.registerUser({username: 'user', password: 'pass', invite: 'code'}, agent);
                await util.login({username: 'user', password: 'pass'}, agent);

                await util.createTestFile(2048, 'test.bin');

                await verifyFailedUpload('test.bin', 403, 'Forbidden.');

                return Promise.all([
                    util.logout(agent),
                    util.deleteFile('test.bin')
                ]);
            });
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
            })
        })
    });
});

after(() => server.close(() => process.exit(0)));
