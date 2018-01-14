var express = require('express');
var router = express.Router();

var Invite = require('../models/Invite.js');

router.post('/create', function (req, res) {
    if (!req.body.scope) {
        res.status(400).json({'message': 'Bad request.'});
        return;
    }

    var scope;
    try {
        scope = JSON.parse(req.body.scope);
    } catch (e) {
        res.status(500).json({'message': e.name + ': ' + e.message});
        return;
    }

    var expiry = req.body.exp;
    if (!expiry || expiry < Date.now())
        expiry = 0;

    var entry = {
        code: crypto.randomBytes(12).toString('hex'),
        scope: scope,
        issuer: req.session.passport.user,
        issued: Date.now(),
        exp: expiry
    };

    Invite.create(entry, function (err) {
        if (err) {
            throw err;
        } else {
            res.status(200).json({
                code: entry.code,
                scope: entry.scope
            });
        }
    })
});

router.get('/get', function (req, res, next) {
    var query = {issuer: req.session.passport.user};

    if (req.body.code)
        query.code = req.body.code;

    Invite.find(query, function (err, invites) {
        if (err) {
            next(err);
        } else {
            res.status(200).json(invites);
        }
    })
});

router.post('/delete', function (req, res, next) {
    Invite.deleteOne({code: req.body.code}, function (err) {
        if (err) next(err);
        else res.status(200).json({'message': 'Successfully deleted.'});
    });
});

module.exports = router;