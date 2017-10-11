var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Upload = require('../models/Upload.js');

var multer = require('multer');
var dest = multer({dest: 'uploads/'});

function fileNameExists(name) {
    Upload.count({name: name}, function(err, count) {
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

router.post('/', dest.single('file'), function(req, res) {
    //if (!req.payload._id) {
        //console.log("Got unauthorized POST attempt");
        //res.status(401);
        //return;
    //}

    var entry = {
        name: genFileName(),
        oname: req.file.originalname,
        created: Date.now(),
        file: req.file
    };

    Upload.create(entry, function(err, next) {
        if (err) {
            next(err);
        } else {
            res.send(entry);
        }
    });
});

module.exports = router;
