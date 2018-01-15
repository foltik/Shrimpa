var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');
var Upload = require('../models/Upload.js');
var Key = require('../models/Key.js');

var multer = require('multer');
var dest = multer({dest: 'uploads/'});

function fileNameExists(name) {
    Upload.count({name: name}, function (err, count) {
        return count !== 0;
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

function updateStats(type, id, size) {
    if (type === 'session') {
        User.updateOne({username: id}, {$inc: {uploadCount: 1, uploadSize: size}}, function (err) {
            if (err) throw err;
        });
    } else if (type === 'apikey') {
        Key.updateOne({key: id}, {$inc: {uploadCount: 1, uploadSize: size}}, function (err) {
            if (err) throw err;
        });
    }
}

var checkApiKey = function (key, cb) {
    Key.find({key: key}, function (err, res) {
        if (err) throw err;
        cb(res.length === 1, res);
    });
};

var checkScope = function (type, id, perm, cb) {
    if (type === 'session') {
        User.findOne({username: id}, function (err, user) {
            if (err) throw err;
            cb(user.scope.indexOf(perm) !== -1);
        });
    } else {
        Key.findOne({key: id}, function (err, key) {
            if (err) throw err;
            cb(key.scope.indexOf(perm) !== -1);
        });
    }
};

function uploadFile(req, res, type, key) {
    if (!req.file)
        return res.status(400).json({'message': 'No file specified.'});

    // Size must be below 128 Megabytes (1024*1024*128 Bytes)
    if (req.file.size >= 134217728)
        return res.status(413).json({'message': 'File too large.'});

    var uploader = type === 'session' ? req.session.passport.user : key[0].username;
    var uploadKey = type === 'apikey' ? key[0].key : null;
    var id = type === 'session' ? req.session.passport.user : key[0].key;

    checkScope(type, id, 'file.upload', function (valid) {
        if (!valid)
            return res.status(403).json({'message': 'No permission.'});

        var entry = {
            name: genFileName(),
            uploader: uploader,
            uploadKey: uploadKey,
            date: Date.now(),
            file: req.file
        };

        updateStats(type, id, req.file.size);

        Upload.create(entry, function (err) {
            if (err) throw err;
            res.status(200).json({
                name: entry.name,
                url: 'https://shimapan.rocks/v/' + entry.name
            });
        });
    });
}

router.post('/', dest.single('file'), function (req, res) {
    if (!req.session || !req.session.passport) {
        if (!req.body.apikey) {
            return res.sendStatus(401);
        } else {
            checkApiKey(req.body.apikey, function (valid, key) {
                if (!valid)
                    return res.sendStatus(401);
                else
                    uploadFile(req, res, 'apikey', key);
            });
        }
    } else {
        uploadFile(req, res, 'session');
    }
});

module.exports = router;
