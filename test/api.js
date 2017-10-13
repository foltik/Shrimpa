process.env.NODE_ENV = 'test';

var async = require('async');

var mongoose = require('mongoose');
var User = require('../app/models/User.js');
var Invite = require('../app/models/Invite.js');
var Upload = require('../app/models/Upload.js');
var Token = require('../app/models/Token.js');

var chai = require('chai');
var should = chai.should();
var app = require('../server');
var server = app.server;

var util = require('./testUtil.js');

before(function (done) {
    async.series([
        function (cb) {
            util.resetDatabase(cb);
        },
        function(cb) {
            util.createInvites([{
                code: 'TestCode1',
                scope: ['test.perm']
            }, {
                code: 'TestCode2'
            }, {
                code: 'TestCode3',
                exp: new Date() - 1
            }
            ], cb);
        }
    ], function (err) {
        if (err) console.log(err);
        done();
    });
});

describe('Users', function () {
    describe('/POST register', function () {
        it('SHOULD register valid user, valid invite', function (done) {
            util.verifySuccessfulRegister({
                username: 'TestUser1',
                password: 'TestPassword',
                invite: 'TestCode1'
            }, done);
        });

        it('SHOULD register another valid user, valid invite', function(done) {
            util.verifySuccessfulRegister({
                username: 'TestUser2',
                password: 'TestPassword',
                invite: 'TestCode2'
            }, done);
        });

        it('SHOULD NOT register invalid user, valid invite', function (done) {
            util.verifyFailedUserRegister({
                username: 'TestUser1',
                password: 'TestPassword',
                invite: 'TestCode2'
            }, done);
        });

        it('SHOULD NOT register valid user, nonexistant invite', function (done) {
            util.verifyFailedInviteRegister({
                username: 'TestUser3',
                password: 'TestPassword',
                invite: 'bogus'
            }, done);
        });

        it('SHOULD NOT register valid user, used invite', function (done) {
            util.verifyFailedInviteRegister({
                username: 'TestUser3',
                password: 'TestPassword',
                invite: 'TestCode1'
            }, done);
        });

        it('SHOULD NOT register valid user, expired invite', function (done) {
            util.verifyFailedInviteRegister({
                username: 'TestUser3',
                password: 'TestPassword',
                invite: 'TestCode3'
            }, done);
        })
    });

    describe('/POST login', function () {
        it('SHOULD accept valid user, valid password', function (done) {
            util.verifySuccessfulLogin({
                username: 'TestUser1',
                password: 'TestPassword'
            }, done);
        });

        it('SHOULD NOT accept valid user, invalid password', function (done) {
            util.verifyFailedPasswordLogin({
                username: 'TestUser1',
                password: 'bogus'
            }, done);
        });

        it('SHOULD NOT accept invalid user, any password', function (done) {
            util.verifyFailedUsernameLogin({
                username: 'BogusTestUser',
                password: 'bogus'
            }, done);
        });
    });

});

describe('Uploads', function () {
    describe('/POST upload', function () {
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

after(function () {
    server.close(function () {
        process.exit();
    });
});
