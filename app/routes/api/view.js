const express = require('express');
const router = express.Router();
const config = require('config');
const fs = require('fs');

const ModelPath = '../../models/';
const Upload = require(ModelPath + 'Upload.js');

const wrap = require('../../util/wrap.js');


const incrementViews = async id =>
    Upload.updateOne({id: id}, {$inc: {views: 1}});


router.get('/:id', wrap(async (req, res) => {
    const upload = await Upload.findOne({id: req.params.id});
    if (!upload)
        return res.status(404).json({message: 'File not found.'});

    // Increment the file's view counter
    await incrementViews(req.params.id);

    // Whether the file should be an attachment or displayed inline on the page
    const mimetype = upload.file.mime.split('/');
    const inlineMimeTypes = config.get('View.inlineMimeTypes').map(type => type.split('/'));
    let inline = inlineMimeTypes.some(type =>
        (mimetype[0] === type[0] || type[0] === '*') &&
        (mimetype[1] === type[1] || type[1] === '*'));

    res.status(200);
    res.set({
        'Content-Disposition': inline ? 'inline' : 'attachment; filename="' + upload.file.originalName + '"',
        'Content-Type': upload.file.mime
    });

    fs.createReadStream(upload.file.path)
        .pipe(res);
}));

module.exports = router;