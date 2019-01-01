process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

const ModelPath = '../app/models/';
const User = require(ModelPath + 'User.js');
const Upload = require(ModelPath + 'Upload.js');
const Key = require(ModelPath + 'Key.js');
const Invite = require(ModelPath + 'Invite.js');
const View = require(ModelPath + 'View.js');

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

//---------------- RESPONSE VERIFICATION ----------------//

exports.verifyResponse = (res, status, message) => {
    res.should.have.status(status);
    res.body.should.be.a('object');
    res.body.should.have.property('message').equal(message);
};

exports.verifyResponseObj = (res, status, obj) => {
    res.should.have.status(status);
    res.body.should.deep.equal(obj);
};

//---------------- DATABASE UTIL ----------------//

exports.clearDatabase = () =>
    Promise.all([
        User.deleteMany(),
        Invite.deleteMany(),
        Key.deleteMany(),
        Upload.deleteMany(),
        View.deleteMany()
    ]);

exports.insertInvite = invite =>
    Invite.create(invite);

exports.insertKey = key =>
    Key.create(key);

exports.insertUpload = upload =>
    Upload.create(upload);

exports.insertView = view =>
    View.create(view);

exports.setBanned = (username, banned) =>
    User.updateOne({username: username}, {banned: banned});

//---------------- API ROUTES ----------------//

exports.login = (credentials, agent) =>
    agent.post('/api/auth/login')
        .send(credentials);

exports.logout = agent =>
    agent.post('/api/auth/logout');

exports.registerUser = (user, agent) =>
    agent.post('/api/auth/register')
        .send(user);

exports.whoami = (agent, key) =>
    agent.get('/api/auth/whoami')
        .send({key: key});

//---------------- TEST ENTRY CREATION ----------------//

exports.createTestInvite = () =>
    exports.insertInvite({code: 'code', scope: ['file.upload'], issuer: 'Mocha'});

exports.createTestInvites = (n) =>
    Promise.all(
        Array.from(new Array(n), (val, index) => 'code' + index)
            .map(code => exports.insertInvite({code: code, scope: ['file.upload'], issuer: 'Mocha'}))
    );

exports.createTestUser = async agent => {
    await exports.createTestInvite();
    return exports.registerUser({displayname: 'user', password: 'pass', invite: 'code'}, agent);
};

exports.createTestSession = async agent => {
    await exports.createTestUser(agent);
    return exports.login({displayname: 'user', password: 'pass'}, agent);
};

exports.createSession = async (agent, scope, displayname) => {
    await exports.insertInvite({code: 'code', scope: scope, issuer: 'Mocha'});
    await exports.registerUser({displayname: displayname ? displayname : 'user', password: 'pass', invite: 'code'}, agent);
    await exports.login({displayname: displayname ? displayname : 'user', password: 'pass'}, agent);
    await Invite.deleteOne({code: 'code'});
};

exports.createTestFile = (size, name) =>
    fsPromises.writeFile(name, Buffer.allocUnsafe(size));

exports.createTestKey = scope =>
    exports.insertKey({key: 'key', identifier: 'test', scope: scope, issuer: 'Mocha'});

//---------------- FILESYSTEM ----------------//

exports.deleteFile = file =>
    fsPromises.unlink(file);

exports.fileExists = file =>
    fsPromises.access(file, fs.constants.R_OK);

exports.fileSize = async file =>
    (await fsPromises.stat(file)).size;

exports.fileHash = file =>
    new Promise((resolve, reject) => {
        const hash = crypto.createHash('MD5');
        fs.createReadStream(file)
            .on('error', reject)
            .on('data', chunk => hash.update(chunk))
            .on('end', () => resolve(hash.digest('hex')));
    });

exports.bufferHash = buffer =>
    crypto.createHash('MD5')
        .update(buffer)
        .digest('hex');

exports.directoryFileCount = async dir =>
    (await fsPromises.readdir(dir)).length;

exports.clearDirectory = async dir => {
    const files = await fsPromises.readdir(dir);
    const promises = files.map(file => fsPromises.unlink(path.join(dir, file)));
    return Promise.all(promises);
};

//---------------- UPLOADS ----------------//

exports.upload = (file, agent, key) => {
    const request = agent.post('/api/upload');

    if (key)
        request.field('key', key);

    return request.attach('file', file);
};

//---------------- Invites ----------------//

exports.createInvite = (invite, agent) =>
    agent.post('/api/invites/create')
        .send(invite);

exports.deleteInvite = (code, agent) =>
    agent.post('/api/invites/delete')
        .send({code: code});

exports.getInvites = (query, agent) =>
    agent.get('/api/invites/get')
        .send(query);

//---------------- Keys ----------------//

exports.createKey = (key, agent) =>
    agent.post('/api/keys/create')
        .send(key);

exports.deleteKey = (key, agent) =>
    agent.post('/api/keys/delete')
        .send({key: key});

exports.getKeys = (query, agent) =>
    agent.get('/api/keys/get')
        .send(query);

//---------------- Viewing ----------------//

exports.binaryFileParser = (res, cb) => {
    res.setEncoding('binary');
    res.data = '';
    res.on("data", function (chunk) {
        res.data += chunk;
    });
    res.on('end', function () {
        cb(null, Buffer.from(res.data, 'binary'));
    });
};

exports.view = (id, agent) =>
    agent.get('/v/' + id)
        .buffer();

//---------------- Users ----------------//

exports.getUsers = (query, agent) =>
    agent.get('/api/users/get')
        .send(query);

exports.ban = (username, agent) =>
    agent.post('/api/users/ban')
        .send({username: username});

exports.unban = (username, agent) =>
    agent.post('/api/users/unban')
        .send({username: username});

//---------------- Stats ----------------//

exports.getStatsUploads = (query, agent) =>
    agent.get('/api/stats/uploads')
        .send(query);

exports.getStatsViews = (query, agent) =>
    agent.get('/api/stats/views')
        .send(query);

exports.getStatsWeek = agent =>
    agent.get('/api/stats/week');

exports.getStatsAll = agent =>
    agent.get('/api/stats/all');

