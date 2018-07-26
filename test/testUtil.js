process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();

const User = require('../app/models/User.js');
const Invite = require('../app/models/Invite.js');
const Upload = require('../app/models/Upload.js');

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const fs = require('fs').promises;

//---------------- DATABASE UTIL ----------------//

exports.clearDatabase = async () =>
    Promise.all([
        User.remove({}),
        Invite.remove({}),
        Upload.remove({})
    ]);

//---------------- API ROUTES ----------------//

exports.login = async (credentials, agent) =>
    agent
        .post('/api/auth/login')
        .send(credentials);

exports.logout = agent =>
    agent
        .post('/api/auth/logout');

exports.createInvite = async (invite) =>
    Invite.create(invite);

exports.registerUser = async (user, agent) =>
    agent
        .post('/api/auth/register')
        .send(user);

exports.whoami = async (agent) =>
    agent
        .get('/api/auth/whoami')
        .send();

//---------------- TEST ENTRY CREATION ----------------//

exports.createTestInvite = async () =>
    exports.createInvite({code: 'code', scope: ['file.upload']});

exports.createTestInvites = async (n) =>
    Promise.all(
        Array.from(new Array(n), (val, index) => 'code' + index)
            .map(code => exports.createInvite({code: code}))
    );

exports.createTestUser = async agent => {
    await exports.createTestInvite();
    return exports.registerUser({username: 'user', password: 'pass', invite: 'code'}, agent);
};

exports.createTestSession = async agent => {
    await exports.createTestUser(agent);
    await exports.login({username: 'user', password: 'pass'}, agent);
};

exports.createTestFile = async (size, name) =>
    fs.writeFile(name, Buffer.allocUnsafe(size));

exports.deleteTestFile = async name =>
    fs.unlink(name);

//---------------- UPLOADS ----------------//

exports.upload = (file, agent) =>
    agent
        .post('/api/upload')
        .attach('file', file);
