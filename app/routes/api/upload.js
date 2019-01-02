const express = require('express');
const router = express.Router();
const config = require('config');

const ModelPath = '../../models/';
const Upload = require(ModelPath + 'Upload.js');

const uploadMultipart = require('../../util/upload/multipart');
const updateStats = require('../../util/upload/stats');

router.post('/', uploadMultipart, async (req, res) => {
    const upload = {
        uid: req.file.name,
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
        uid: req.file.name,
        url: config.get('Server.hostname') + '/v/' + upload.uid
    });
});

module.exports = router;
