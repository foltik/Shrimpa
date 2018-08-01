const express = require('express');
const router = express.Router();
const config = require('config');

const ModelPath = '../../models/';
const Upload = require(ModelPath + 'Upload.js');

const uploadMultipart = require('../../util/upload/multipart');
const updateStats = require('../../util/upload/stats');

const wrap = require('../../util/wrap.js');

router.post('/', uploadMultipart, wrap(async (req, res) => {
    const upload = {
        id: req.file.name,
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
        id: req.file.name,
        url: config.get('Server.hostname') + '/v/' + upload.id
    });
}));

module.exports = router;
