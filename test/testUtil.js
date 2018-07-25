process.env.NODE_ENV = 'test';

var async = require('async');

var mongoose = require('mongoose');
var User = require('../app/models/User.js');
var Invite = require('../app/models/Invite.js');
var Upload = require('../app/models/Upload.js');

var chai = require('chai');
var http = require('chai-http');
var app = require('../server');
var server = app.server;
var db = app.db;

var should = chai.should;
var expect = chai.expect;

chai.use(http);

//TODO: BAD! Move to a util file!
// Normalizes, decomposes, and lowercases a utf-8 string
const canonicalizeUsername = username => username.normalize('NFKD').toLowerCase();

//---------------- DATABASE UTIL ----------------//

var resetDatabase = function(cb) {
    async.each(
        [User, Invite, Upload],
        (schema, cb) => schema.remove({}, cb),
    cb);
};

const createInvite = function(invite, done) {
    if (!invite.code) invite.code = 'code';
    if (!invite.scope) invite.scope = ['test.perm', 'file.upload'];
    if (!invite.issuer) invite.issuer = 'Mocha';
    if (!invite.issued) invite.issued = new Date();
    Invite.create(invite, done);
};

const createInvites = function(invites, done) {
    async.each(invites, createInvite, done);
};

var createTestInvite = function(done) {
    createInvite({code: 'code'}, done);
};

var createTestInvites = function(n, done) {
    const codes = Array.from(new Array(n), (val, index) => 'code' + index);
    async.each(codes, (code, cb) => createInvite({code: code}, cb), done);
};


//---------------- REGISTER UTIL ----------------//

const register = function(user, cb) {
    chai.request(server)
        .post('/api/auth/register')
        .send(user)
        .end(cb);
};

const verifySuccessfulRegister = function(user, done) {
    register(user, function(err, res) {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Registration successful.');
        User.countDocuments({username: user.username}, function(err, count) {
            count.should.eql(1);
            Invite.countDocuments({recipient: canonicalizeUsername(user.username)}, function(err, count) {
                count.should.eql(1);
                done();
            });
        });
    });
};

const verifyFailedRegister = function(user, message, status, done) {
    register(user, function(err, res) {
        res.should.have.status(status);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql(message);
        done();
    })
};

//---------------- LOGIN UTIL ----------------//

var login = function(user, cb) {
    chai.request(server)
        .post('/api/auth/login')
        .send(user)
        .end(cb);
};

var verifySuccessfulLogin = function(user, done) {
    login(user, function(err, res) {
        res.should.have.status(200);
        done();
    });
};

var verifyFailedUsernameLogin = function(user, done) {
    login(user, function(err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid username.');
        done();
    });
};

var verifyFailedPasswordLogin = function(user, done) {
    login(user, function(err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid password.');
        done();
    });
};


//---------------- UPLOAD UTIL ----------------//

var upload = function(token, file, cb) {
    chai.request(server)
        .post('/api/upload')
        .attach('file', file)
        .set('Authorization', 'Bearer ' + token)
        .end(cb);
};

var loginUpload = function(user, cb) {
    login(user, function(err, res) {
        upload(res.body.token, 'test/test.png', cb);
    });
};

var loginUploadFile = function(user, file, cb) {
    login(user, function(err, res) {
        upload(res.body.token, file, cb);
    });
};

var verifySuccessfulUpload = function(user, done) {
    loginUpload(user, function(err, res) {
        res.should.have.status(200);
        res.body.should.have.be.a('object');
        res.body.should.have.property('url');
        res.body.should.have.property('name');
        expect(res.body.name).to.match(/^[a-z]{6}$/);
        done();
    });
};

var verifyFailedSizeUpload = function(user, done) {
    loginUploadFile(user, 'test/large.bin', function(err, res) {
        res.should.have.status(413);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('File too large.');
        done();
    });
};

var verifyFailedPermissionUpload = function(user, done) {
    loginUpload(user, function(err, res) {
        res.should.have.status(403);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Permission error.');
        done();
    });
};

var verifyFailedAuthUpload = function(done) {
    async.parallel([
        function(cb) {
            upload('bogus', 'test/test.png', function(err, res) {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql('UnauthorizedError: jwt malformed');
                cb();
            });
        },
        function(cb) {
            upload('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
                'eyJpc3MiOiJzaGltYXBhbi5yb2NrcyIsImlhd' +
                'CI6MTUwNzkyNTAyNSwiZXhwIjoxNTM5NDYxMD' +
                'I1LCJhdWQiOiJ3d3cuc2hpbWFwYW4ucm9ja3M' +
                'iLCJzdWIiOiJUZXN0VXNlciIsInVzZXJuYW1l' +
                'IjoiVGVzdFVzZXIiLCJzY29wZSI6ImZpbGUud' +
                'XBsb2FkIn0.e746_BNNuxlbXKESKKYsxl6e5j' +
                '8JwmEFxO3zRf66tWo',
                'test/test.png',
                function(err, res) {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('UnauthorizedError: invalid signature');
                    cb();
                })
        }
    ], function(err, res) {
        if (err) console.log(err);
        done();
    });
};


module.exports = {
    resetDatabase: resetDatabase,

    createInvite: createInvite,
    createInvites: createInvites,
    createTestInvite: createTestInvite,
    createTestInvites: createTestInvites,

    register: register,
    verifySuccessfulRegister: verifySuccessfulRegister,
    verifyFailedRegister: verifyFailedRegister,

    login: login,
    verifySuccessfulLogin: verifySuccessfulLogin,
    verifyFailedUsernameLogin: verifyFailedUsernameLogin,
    verifyFailedPasswordLogin: verifyFailedPasswordLogin,

    upload: upload,
    loginUpload: loginUpload,
    verifySuccessfulUpload: verifySuccessfulUpload,
    verifyFailedAuthUpload: verifyFailedAuthUpload,
    verifyFailedPermissionUpload: verifyFailedPermissionUpload,
    verifyFailedSizeUpload: verifyFailedSizeUpload
};
