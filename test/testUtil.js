process.env.NODE_ENV = 'test';

const User = require('../app/models/User.js');
const Invite = require('../app/models/Invite.js');
const Upload = require('../app/models/Upload.js');

const chai = require('chai');
const http = require('chai-http');
chai.use(http);
const should = chai.should();

const app = require('../server');
const server = app.server;

//TODO: REMOVE
const async = require('async');

const canonicalize = require("../app/util/canonicalize").canonicalize;


//---------------- DATABASE UTIL ----------------//

exports.clearDatabase = async () =>
    Promise.all([
        User.remove({}),
        Invite.remove({}),
        Upload.remove({})
    ]);

//---------------- API ROUTES ----------------//

exports.login = async (credentials) =>
    chai.request(server)
        .post('/api/auth/login')
        .send(credentials);

exports.createInvite = async (invite) => {
    if (!invite.code) invite.code = 'code';
    if (!invite.scope) invite.scope = ['test.perm', 'file.upload'];
    if (!invite.issuer) invite.issuer = 'Mocha';
    if (!invite.issued) invite.issued = new Date();
    return Invite.create(invite);
};

exports.registerUser = async (user) => {
    if (!user.username) user.username = 'user';
    if (!user.password) user.password = 'pass';
    if (!user.invite) user.invite = 'code';
    return chai.request(server)
        .post('/api/auth/register')
        .send(user);
};

//---------------- TEST ENTRY CREATION ----------------//

exports.createTestInvite = async () =>
    exports.createInvite({});

exports.createTestInvites = async (n) => {
    const codes = Array.from(new Array(n), (val, index) => 'code' + index);
    return Promise.all(codes.map(code => exports.createInvite({code: code})));
};

exports.createTestUser = async () => {
    await exports.createTestInvite();
    return exports.registerUser({});
};

//---------------- UPLOAD API ----------------//

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
