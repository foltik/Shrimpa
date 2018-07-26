var express = require('express');
var router = express.Router();

var User = require('../models/User.js');
var Upload = require('../models/Upload.js');
var Key = require('../models/Key.js');

var multer = require('multer');
var dest = multer({dest: 'uploads/'});

const requireAuth = require('../util/requireAuth').requireAuth;
const wrap = require('../util/wrap.js').wrap;


const generatedIdExists = async id =>
    await Upload.countDocuments({id: id}) === 1;

const generateId = async () => {
    const charset = "abcdefghijklmnopqrstuvwxyz";
    const len = 6;

    const id = [...Array(len)]
        .map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
        .join('');

    return await generatedIdExists(id)
        ? generateId()
        : id;
};

const updateStats = async req =>
    Promise.all([
        User.updateOne({username: req.authUser}, {$inc: {uploadCount: 1, uploadSize: req.file.size}}),
        req.authKey
            ? Key.updateOne({key: req.authKey}, {$inc: {uploadCount: 1, uploadSize: req.file.size}})
            : Promise.resolve()
    ]);


router.post('/', requireAuth('file.upload'), dest.single('file'), wrap(async (req, res, next) => {
    if (!req.file)
        return res.status(400).json({message: 'No file specified.'});

    // Max file size is 128 MiB
    if (req.file.size > 1024 * 1024 * 128)
        return res.status(413).json({message: 'File too large.'});

    const upload = {
        name: req.file.originalname,
        id: await generateId(),
        uploader: req.authUser,
        uploaderKey: req.authKey,
        date: Date.now(),
        mime: req.file.mimetype,
        file: req.file
    };

    await Promise.all([
        Upload.create(upload),
        updateStats(req)
    ]);

    res.status(200).json({
        id: upload.id,
        url: 'https://shimapan.rocks/v/' + upload.id
    });
}));

module.exports = router;
