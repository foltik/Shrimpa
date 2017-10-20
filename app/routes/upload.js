var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');
var Upload = require('../models/Upload.js');

var multer = require('multer');
var dest = multer({dest: 'uploads/'});

function fileNameExists(name) {
    Upload.count({name: name}, function (err, count) {
        return count !== 0;
    });
}

function updateUserStats(user, size) {
    User.updateOne({username: user}, {$inc: {uploadCount: 1, uploadSize: size}}, function (err, res) {
        if (err) throw err;
    });
}

function genFileName() {
    var charset = "abcdefghijklmnopqrstuvwxyz";
    do {
        var chars = [];
        for (var i = 0; i < 6; i++)
            chars.push(charset.charAt(Math.floor(Math.random() * charset.length)));
    } while (fileNameExists(chars.join('')));
    return chars.join('');
}

router.post('/', dest.single('file'), function (req, res) {
    // Size must be below 128 Megabytes (1024*1024*128 Bytes)
    if (req.file.size >= 134217728) {
        res.status(413).json({'message': 'File too large.'});
        return;
    }

    updateUserStats(req.session.passport.user, req.file.size);

    var entry = {
        name: genFileName(),
        uploader: req.session.passport.user,
        created: Date.now(),
        file: req.file
    };

    Upload.create(entry, function (err, next) {
        if (err) {
            next(err);
        } else {
            res.send({
                name: entry.name,
                url: 'https://shimapan.rocks/v/' + entry.name
            });
        }
    });
});

module.exports = router;
