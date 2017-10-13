process.env.NODE_ENV = 'test';

var async = require('async');

var mongoose = require('mongoose');
var User = require('../app/models/User.js');
var Invite = require('../app/models/Invite.js');

var fs = require('fs');
var path = require('path');
var chai = require('chai');
var http = require('chai-http');
var should = chai.should();
var app = require('../server');
var server = app.server;
var db = app.db;

chai.use(http);

function register(user, cb) {
    chai.request(server)
        .post('/api/auth/register')
        .send(user)
        .end(cb);
}

function verifySuccessfulRegister(user, done) {
    register(user, function (err, res) {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('token');
        done();
    });
}

function verifyFailedUserRegister(user, done) {
    register(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Username in use.');
        done();
    });
}

function verifyFailedInviteRegister(user, done) {
    register(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid invite code.');
        done();
    })
}


function login(user, cb) {
    chai.request(server)
        .post('/api/auth/login')
        .send(user)
        .end(cb);
}

function verifySuccessfulLogin(user, done) {
    login(user, function (err, res) {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('token');
        done();
    });
}

function verifyFailedUsernameLogin(user, done) {
    login(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid username.');
        done();
    });
}

function verifyFailedPasswordLogin(user, done) {
    login(user, function (err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Invalid password.');
        done();
    });
}

function upload(token, cb) {
    chai.request(server)
        .post('/api/upload')
        .attach('file', 'test/test.png')
        .set('Authorization', 'Bearer ' + token)
        .end(cb);
}

function loginUpload(user, cb) {
    login(user, function(err, res) {
        upload(res.body.token, cb);
    });
}

function verifySuccessfulUpload(user, done) {
    loginUpload(user, function(err, res) {
        res.should.have.status(200);
        res.body.should.have.be.a('object');
        res.body.should.have.property('name');
        res.body.should.have.property('oname');
        res.body.should.have.property('created');
        done();
    });
}

function verifyFailedSizeUpload(user, done) {
    loginUpload(user, done, function(err, res) {
        //TODO
    });
}

function verifyFailedPermissionUpload(user, done) {
    loginUpload(user, function(err, res) {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Permission error.');
        done();
    });
}

function verifyFailedAuthUpload(done) {
    async.parallel([
        function(cb) {
            upload('bogus', function (err, res) {
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
                   '8JwmEFxO3zRf66tWo', function(err, res) {
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
}

before(function (done) {
    async.series([
        function (cb) {
            db.once('open', function () {
                cb();
            });
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
        },
        function (cb) {
            var inv = new Invite();
            inv.code = 'TestCode3';

            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            inv.exp = yesterday;

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
                username: 'TestUser1',
                password: 'TestPassword',
                invite: 'TestCode1'
            };

            verifySuccessfulRegister(user, done);
        });

        it('SHOULD register another valid user, valid invite', function(done) {
            var user = {
                username: 'TestUser2',
                password: 'TestPassword',
                invite: 'TestCode2'
            };

            verifySuccessfulRegister(user, done);
        });

        it('SHOULD NOT register invalid user, valid invite', function (done) {
            var user = {
                username: 'TestUser1',
                password: 'TestPassword',
                invite: 'TestCode2'
            };

            verifyFailedUserRegister(user, done);
        });

        it('SHOULD NOT register valid user, nonexistant invite', function (done) {
            var user = {
                username: 'TestUser3',
                password: 'TestPassword',
                invite: 'bogus'
            };

            verifyFailedInviteRegister(user, done);
        });

        it('SHOULD NOT register valid user, used invite', function (done) {
            var user = {
                username: 'TestUser3',
                password: 'TestPassword',
                invite: 'TestCode1'
            };

            verifyFailedInviteRegister(user, done);
        });

        it('SHOULD NOT register valid user, expired invite', function (done) {
            var user = {
                username: 'TestUser3',
                password: 'TestPassword',
                invite: 'TestCode3'
            };

            verifyFailedInviteRegister(user, done);
        })
    });

    describe('/POST login', function () {
        it('SHOULD accept valid user, valid password', function (done) {
            var user = {
                username: 'TestUser1',
                password: 'TestPassword'
            };

            verifySuccessfulLogin(user, done);
        });

        it('SHOULD NOT accept valid user, invalid password', function (done) {
            var user = {
                username: 'TestUser1',
                password: 'bogus'
            };

            verifyFailedPasswordLogin(user, done);
        });

        it('SHOULD NOT accept invalid user, any password', function (done) {
            var user = {
                username: 'BogusTestUser',
                password: 'bogus'
            };

            verifyFailedUsernameLogin(user, done);
        });
    });

});

describe('Uploads', function () {
    describe('/POST upload', function () {
        it('SHOULD accept logged in valid upload', function(done) {
            var user = {
                username: 'TestUser2',
                password: 'TestPassword'
            };

            verifySuccessfulUpload(user, done);
        });

        it('SHOULD NOT accept unauthenticated valid upload', function(done) {
            verifyFailedAuthUpload(done);
        });

        it('SHOULD NOT accept invalid permission, valid upload', function(done) {
            var user = {
                username: 'TestUser1',
                password: 'TestPassword'
            };

            verifyFailedPermissionUpload(user, done);
        })
    });
});

after(function () {
    server.close(function () {
        process.exit();
    });
});
