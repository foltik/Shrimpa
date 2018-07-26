process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

const ModelPath = '../app/models/';
const User = require(ModelPath + 'User.js');
const Upload = require(ModelPath + 'Upload.js');
const Key = require(ModelPath + 'Key.js');
const Invite = require(ModelPath + 'Invite.js');

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const fs = require('fs');
const fsPromises = fs.promises;

//---------------- DATABASE UTIL ----------------//

exports.clearDatabase = () =>
    Promise.all([
        User.remove({}),
        Invite.remove({}),
        Key.remove({}),
        Upload.remove({})
    ]);

//---------------- API ROUTES ----------------//

exports.login = (credentials, agent) =>
    agent
        .post('/api/auth/login')
        .send(credentials);

exports.logout = agent =>
    agent
        .post('/api/auth/logout');

exports.createInvite = (invite) =>
    Invite.create(invite);

exports.registerUser = (user, agent) =>
    agent
        .post('/api/auth/register')
        .send(user);

exports.whoami = (agent) =>
    agent
        .get('/api/auth/whoami')
        .send();

//---------------- TEST ENTRY CREATION ----------------//

exports.createTestInvite = () =>
    exports.createInvite({code: 'code', scope: ['file.upload'], issuer: 'Mocha'});

exports.createTestInvites = (n) =>
    Promise.all(
        Array.from(new Array(n), (val, index) => 'code' + index)
            .map(code => exports.createInvite({code: code, scope: ['file.upload'], issuer: 'Mocha'}))
    );

exports.createTestUser = async agent => {
    await exports.createTestInvite();
    return exports.registerUser({displayname: 'user', password: 'pass', invite: 'code'}, agent);
};

exports.createTestSession = async agent => {
    await exports.createTestUser(agent);
    return exports.login({displayname: 'user', password: 'pass'}, agent);
};

exports.createTestFile = (size, name) =>
    fsPromises.writeFile(name, Buffer.allocUnsafe(size));

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

exports.directoryFileCount = async dir =>
    (await fsPromises.readdir(dir)).length;

//---------------- UPLOADS ----------------//

exports.upload = (file, agent) =>
    agent
        .post('/api/upload')
        .attach('file', file);
