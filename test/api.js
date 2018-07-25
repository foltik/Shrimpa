process.env.NODE_ENV = 'test';

const app = require('../server');
const server = app.server;

const User = require('../app/models/User.js');
const Invite = require('../app/models/Invite.js');
const Upload = require('../app/models/Upload.js');

const util = require('./testUtil.js');
const canonicalize = require('../app/util/canonicalize').canonicalize;

describe('Users', function() {
    beforeEach(async () => util.clearDatabase());

    describe('/POST register', () => {
        describe('0 Valid Request', () => {
            async function verifySuccessfulRegister(user) {
                await util.createTestInvite();

                const res = await util.registerUser(user);

                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql('Registration successful.');

                const userCount = await User.countDocuments({username: user.username});
                userCount.should.eql(1);

                const inviteCount = await Invite.countDocuments({code: user.invite, recipient: canonicalize(user.username)});
                inviteCount.should.eql(1);
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
                    await util.createInvite(invite);
                    user.invite = invite.code;
                }

                const res = await(util.registerUser(user));
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql(message);
            }

            it('MUST NOT register a nonexistant invite', async () =>
                verifyRejectedInvite(null, 'Invalid invite code.')
            );

            it('MUST NOT register a used invite', async () =>
                verifyRejectedInvite({used: new Date()}, 'Invite already used.')
            );

            it('MUST NOT register an expired invite', async () =>
                verifyRejectedInvite({exp: new Date()}, 'Invite expired.')
            );
        });


        describe('2 Invalid Usernames', () => {
            async function verifyRejectedUsername(user, message) {
                const res = await util.registerUser(user);
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql(message);
            }

            it('MUST NOT register a duplicate username', async () => {
                await util.createTestInvites(2);
                const user0 = {username: 'user', password: 'pass', invite: 'code0'};
                const user1 = {username: 'user', password: 'diff', invite: 'code1'};

                await util.registerUser(user0);
                return verifyRejectedUsername(user1, 'Username in use.');
            });

            it('MUST NOT register a username with a duplicate canonical name', async () => {
                await util.createTestInvites(2);
                const user0 = {username: 'bigbird', password: 'pass', invite: 'code0'};
                const user1 = {username: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'diff', invite: 'code1'};

                await util.registerUser(user0);
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
            const res = await util.login(credentials);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message').eql('Logged in.');
        }

        async function verifyFailedLogin(credentials) {
            const res = await util.login(credentials);
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('message').eql('Unauthorized.');
        }

        describe('0 Valid Request', () => {
            it('SHOULD accept a valid user with a valid password', async () => {
                await util.createTestUser();
                return verifySuccessfulLogin({username: 'user', password: 'pass'});
            });
        });


        describe('1 Invalid Password', () => {
            it('SHOULD NOT accept an invalid password', async () => {
                await util.createTestUser();
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

/*describe('Uploads', function() {
    describe('/POST upload', function() {
        it('SHOULD accept logged in valid upload', function(done) {
            util.verifySuccessfulUpload({
                username: 'TestUser2',
                password: 'TestPassword'
            }, done);
        });

        it('SHOULD NOT accept unauthenticated valid upload', function(done) {
            util.verifyFailedAuthUpload(done);
        });

        it('SHOULD NOT accept invalid permission, valid upload', function(done) {
            util.verifyFailedPermissionUpload({
                username: 'TestUser1',
                password: 'TestPassword'
            }, done);
        });

        it('SHOULD NOT accept invalid size upload', function(done) {
            util.verifyFailedSizeUpload({
                username: 'TestUser2',
                password: 'TestPassword'
            }, done);
        })
    });
});*/

after(() => server.close(() => process.exit(0)));
