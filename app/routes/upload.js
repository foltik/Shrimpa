const express = require('express');
const router = express.Router();
const config = require('config');

const fsPromises = require('fs').promises;

const ModelPath = '../models/';
const User = require(ModelPath + 'User.js');
const Upload = require(ModelPath + 'Upload.js');
const Key = require(ModelPath + 'Key.js');

const verifyScope = require('../util/verifyScope.js');

const multer = require('multer');
const fileUpload = multer({dest: config.get('Upload.path')}).single('file');

const wrap = require('../util/wrap.js');

const generatedIdExists = async id =>
    await Upload.countDocuments({id: id}) === 1;

const generateId = async() => {
    const charset = config.get('Upload.charset');
    const len = config.get('Upload.idLength');

    const id = [...Array(len)]
        .map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
        .join('');

    return await generatedIdExists(id)
        ? generateId()
        : id;
};

const updateStats = async req =>
    Promise.all([
        User.updateOne({username: req.username}, {$inc: {uploadCount: 1, uploadSize: req.file.size}}),
        req.key
            ? Key.updateOne({key: req.key}, {$inc: {uploadCount: 1, uploadSize: req.file.size}})
            : Promise.resolve()
    ]);


router.post('/', fileUpload, wrap(async(req, res) => {
    // We need to authenticate in place because the form data needs to be processed by multer first
    const deleteAndError = async (code, message) => {
        if (req.file)
            await fsPromises.unlink(req.file.path);
        res.status(code).json({message: message});
    };

    if (req.isAuthenticated()) {
        if (verifyScope(req.session.passport.scope, 'file.upload')) {
            req.username = req.session.passport.user;
            req.displayname = req.session.passport.displayname;
            req.scope = req.session.passport.scope;
            req.key = null;
        } else {
            return await deleteAndError(403, 'Forbidden.');
        }
    } else if (req.body.key) {
        const key = await Key.findOne({key: req.body.key});
        if (verifyScope(key.scope, 'file.upload')) {
            req.username = key.issuer;
            req.displayname = key.issuer;
            req.scope = key.scope;
            req.key = key.key;
        } else {
            return await deleteAndError(403, 'Forbidden.');
        }
    } else {
        return await deleteAndError(401, 'Unauthorized.');
    }

    if (!req.file)
        return res.status(400).json({message: 'No file specified.'});

    if (req.file.size > config.get('Upload.maxSize')) {
        await fsPromises.unlink(req.file.path);
        return res.status(413).json({message: 'File too large.'});
    }

    const upload = {
        id: await generateId(),
        uploader: req.username,
        uploaderKey: req.key,
        date: Date.now(),
        file: req.file
    };

    await Promise.all([
        Upload.create(upload),
        updateStats(req)
    ]);

    res.status(200).json({
        message: 'File uploaded.',
        id: upload.id,
        url: config.get('Server.hostname') + '/v/' + upload.id
    });
}));

module.exports = router;
