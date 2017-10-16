process.env.NODE_ENV = 'test';

var async = require('async');

var mongoose = require('mongoose');
var User = require('../app/models/User.js');
var Invite = require('../app/models/Invite.js');
var Upload = require('../app/models/Upload.js');
var Token = require('../app/models/Token.js');

var chai = require('chai');
var http = require('chai-http');
var app = require('../server');
var server = app.server;
var db = app.db;

var should = chai.should;
var expect = chai.expect;

chai.use(http);

//---------------- DATABASE UTIL ----------------//

var resetDatabase = function(callback) {
    db.once('open', function() {
        async.each([
            User, Invite, Upload, Token
        ], function(schema, cb) {
            schema.remove({}, function(err) {
                cb(err);
            });
        }, function(err) {
            if (err) console.log(err);
            callback();
        });
    });
};

var createInvites = function(invites, callback) {
    async.each(invites, function(invite, cb) {
        if (!invite.scope) {
            invite.scope = ['test.perm', 'file.upload'];
        }
        if (!invite.exp) {
            var date = new Date();
            date.setDate(date.getDate() + 7);
            invite.exp = date;
        }

        invite.issuer = 'Mocha';
        invite.issued = new Date();

        Invite.create(invite, function(err) {
            cb(err);
        });
    }, function(err) {
        if (err) console.log(err);
        callback();
    })
};



//---------------- REGISTER UTIL ----------------//

var register = function(user, cb) {
    chai.request(server)
        .post('/api/auth/register')
        .send(user)
        .end(cb);
};

var verifySuccessfulRegister = function(user, done) {
    register(user, function (err, res) {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('token');
        done();
    });
};

var verifyFailedUserRegister = function(user, done) {
    register(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid username.');
        done();
    });
};

var verifyFailedInviteRegister = function(user, done) {
    register(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid invite code.');
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
    login(user, function (err, res) {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('token');
        done();
    });
};

var verifyFailedUsernameLogin = function(user, done) {
    login(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid username.');
        done();
    });
};

var verifyFailedPasswordLogin = function(user, done) {
    login(user, function (err, res) {
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
            upload('bogus', 'test/test.png', function (err, res) {
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

    createInvites: createInvites,

    register: register,
    verifySuccessfulRegister: verifySuccessfulRegister,
    verifyFailedUserRegister: verifyFailedUserRegister,
    verifyFailedInviteRegister: verifyFailedInviteRegister,

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
