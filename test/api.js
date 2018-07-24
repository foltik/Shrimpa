process.env.NODE_ENV = 'test';

var async = require('async');

var mongoose = require('mongoose');
var User = require('../app/models/User.js');
var Invite = require('../app/models/Invite.js');
var Upload = require('../app/models/Upload.js');

var chai = require('chai');
var should = chai.should();
var app = require('../server');
var server = app.server;

var util = require('./testUtil.js');

before(util.resetDatabase);

describe('Users', function() {
    describe('/POST register', function() {
        describe('0 Well Formed Requests', function() {
            beforeEach((done) => {
                async.series([
                    util.resetDatabase,
                    util.createTestInvite
                ], done);
            });

            it('MUST register a valid user with a valid invite', function(done) {
                util.verifySuccessfulRegister({username: 'user', password: 'pass', invite: 'code'}, done);
            });

            it('MUST register a username with unicode symbols and a valid invite', function(done) {
                util.verifySuccessfulRegister({username: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'pass', invite: 'code'}, done);
            })
        });


        describe('1 Invalid Invites', function() {
            beforeEach(util.resetDatabase);

            const verifyRejectedInvite = function(invite, message, done) {
                const user = {username: 'user', password: 'pass', invite: invite && invite.code ? invite.code : 'code'};
                const create = invite ? util.createInvite : (invite, cb) => cb();
                async.series([
                    (cb) => create(invite, cb),
                    (cb) => util.verifyFailedRegister(user, message, 401, cb)
                ], done);
            };

            it('MUST NOT register a nonexistant invite', function(done) {
                verifyRejectedInvite(null, 'Invalid invite code.', done);
            });

            it('MUST NOT register a used invite', function(done) {
                verifyRejectedInvite({used: new Date()}, 'Invite already used.', done);
            });

            it('MUST NOT register an expired invite', function(done) {
                verifyRejectedInvite({exp: new Date()}, 'Invite expired.', done);
            })
        });


        describe('2 Invalid Usernames', function() {
            beforeEach((done) => {
                async.series([
                    util.resetDatabase,
                    (cb) => util.createTestInvites(3, cb)
                ], done);
            });

            it('MUST NOT register a duplicate username', function(done) {
                const user0 = {username: 'user', password: 'pass', invite: 'code0'};
                const user1 = {username: 'user', password: 'diff', invite: 'code1'};
                async.series([
                    (cb) => util.verifySuccessfulRegister(user0, cb),
                    (cb) => util.verifyFailedRegister(user1, 'Username in use.', 401, cb)
                ], done);
            });

            it('MUST NOT register a username with a duplicate canonical name', function(done) {
                const user0 = {username: 'bigbird', password: 'pass', invite: 'code0'};
                const user1 = {username: 'ᴮᴵᴳᴮᴵᴿᴰ', password: 'diff', invite: 'code1'};
                async.series([
                    (cb) => util.verifySuccessfulRegister(user0, cb),
                    (cb) => util.verifyFailedRegister(user1, 'Username in use.', 401, cb)
                ], done);
            });

            it('MUST NOT register a username containing whitespace', function(done) {
                const users = [
                    {username: 'user name', password: 'pass', invite: 'code0'},
                    {username: 'user　name', password: 'pass', invite: 'code1'},
                    {username: 'user name', password: 'pass', invite: 'code2'}
                ];
                const failMsg = 'Username contains invalid characters.';
                async.each(users, (user, cb) => util.verifyFailedRegister(user, failMsg, 401, cb), done);
            });

            it('MUST NOT register a username containing HTML', function(done) {
                const user = {username: 'user<svg/onload=alert("XSS")>', password: 'pass', invite: 'code0'};
                util.verifyFailedRegister(user, 'Username contains invalid characters.', 401, done);
            });
        });
    });

    describe('/POST login', function() {
        it('SHOULD accept valid user, valid password', function(done) {
            util.verifySuccessfulLogin({
                username: 'TestUser1',
                password: 'TestPassword'
            }, done);
        });

        it('SHOULD NOT accept valid user, invalid password', function(done) {
            util.verifyFailedPasswordLogin({
                username: 'TestUser1',
                password: 'bogus'
            }, done);
        });

        it('SHOULD NOT accept invalid user, any password', function(done) {
            util.verifyFailedUsernameLogin({
                username: 'BogusTestUser',
                password: 'bogus'
            }, done);
        });
    });
});

describe('Uploads', function() {
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
});

after(function() {
    server.close(function() {
        process.exit();
    });
});
