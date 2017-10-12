process.env.NODE_ENV = 'test';

var async = require('async');

var mongoose = require('mongoose');
var User = require('../app/models/User.js');
var Invite = require('../app/models/Invite.js');

var chai = require('chai');
var http = require('chai-http');
var should = chai.should();
var app = require('../server');
var server = app.server;
var db = app.db;

chai.use(http);

before(function (done) {
    async.parallel([
        function (cb) {
            db.once('open', cb);
        },
        function (cb) {
            User.remove({}, function (err) {
                cb(err);
            });
        },
        function (cb) {
            Invite.remove({}, function (err) {
                cb(err);
            });
        },
        function (cb) {
            var inv = new Invite();
            inv.code = 'TestCode1';
            inv.scope = ['test.perm'];
            inv.save(function (err) {
                cb(err);
            });
        },
        function (cb) {
            var inv = new Invite();
            inv.code = 'TestCode2';
            inv.scope = ['test.perm', 'file.upload'];
            inv.save(function (err) {
                cb(err);
            });
        }
    ], function (err) {
        if (err) console.log(err);
        done();
    });
});

describe('Users', function () {
    describe('/POST register', function () {
        it('SHOULD register valid user, valid invite', function (done) {
            var user = {
                username: 'TestUser',
                password: 'TestPassword',
                invite: 'TestCode1'
            };

            chai.request(server)
                .post('/api/auth/register')
                .send(user)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('token');
                    done();
                });
        });

        it('SHOULD NOT register invalid user, valid invite', function (done) {
            var user = {
                username: 'TestUser',
                password: 'TestPassword',
                invite: 'TestCode2'
            };

            chai.request(server)
                .post('/api/auth/register')
                .send(user)
                .end(function (err, res) {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Username in use.');
                    done();
                });
        });

        it('SHOULD NOT register valid user, nonexistant invite', function(done) {
            var user = {
                username: 'TestUser2',
                password: 'TestPassword',
                invite: 'bogus'
            };

            chai.request(server)
                .post('/api/auth/register')
                .send(user)
                .end(function(err, res) {
                    res.should.have.a.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Invalid invite code.');
                    done();
                });
        });

        it('SHOULD NOT register valid user, used invite', function(done) {
            var user = {
                username: 'TestUser2',
                password: 'TestPassword',
                invite: 'TestCode1'
            };

            chai.request(server)
                .post('/api/auth/register')
                .send(user)
                .end(function(err, res) {
                    res.should.have.a.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Invalid invite code.');
                    done();
                });
        });

        //TODO: Make sure expired invites don't work
    });
});

after(function () {
    server.close(function () {
        process.exit();
    });
});
