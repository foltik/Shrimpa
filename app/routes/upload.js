const express = require('express');
const router = express.Router();
const config = require('config');

const ModelPath = '../models/';
const User = require(ModelPath + 'User.js');
const Upload = require(ModelPath + 'Upload.js');
const Key = require(ModelPath + 'Key.js');

const multer = require('multer');
const fileUpload = multer({dest: config.get('Upload.path')}).single('file');
const fsPromises = require('fs').promises;

const requireAuth = require('../util/requireAuth').requireAuth;
const wrap = require('../util/wrap.js').wrap;

const generatedIdExists = async id =>
    await Upload.countDocuments({id: id}) === 1;

const generateId = async () => {
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


router.post('/', requireAuth('file.upload'), fileUpload, wrap(async (req, res) => {
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
        id: upload.id,
        url: config.get('Server.hostname') + '/v/' + upload.id
    });
}));

module.exports = router;
