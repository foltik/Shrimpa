var express = require('express');
var router = express.Router();
var crypto = require('crypto');

var Key = require('../models/Key.js');

router.post('/create', function (req, res) {
    if (!req.body.identifier || !req.body.scope) {
        res.status(400).json({'message': 'Bad request.'});
        return;
    }

    Key.count({'username': req.session.passport.user}, function (err, count) {
        if (count >= 10) {
            res.status(403).json({'message': 'Key limit reached.'});
            return;
        }

        var scope;
        try {
            scope = JSON.parse(req.body.scope);
        } catch (e) {
            res.status(400).json({'message': e.name + ': ' + e.message});
            return;
        }

        var id = req.sanitize(req.body.identifier);
        if (id.length === 0) id = "err";

        var entry = {
            key: crypto.randomBytes(32).toString('hex'),
            identifier: id,
            scope: scope,
            username: req.session.passport.user,
            date: Date.now()
        };

        Key.create(entry, function (err) {
            if (err) {
                throw err;
            } else {
                res.status(200).json({
                    key: entry.key,
                    identifier: entry.identifier,
                    scope: entry.scope
                });
            }
        })
    })
});

router.get('/get', function (req, res, next) {
    var query = {username: req.session.passport.user};

    if (req.body.identifier)
        query.identifier = req.body.identifier;

    Key.find(query, function (err, keys) {
        if (err) {
            next(err);
        } else {
            res.status(200).json(keys);
        }
    })
});

router.post('/delete', function(req, res, next) {
    Key.deleteOne({key: req.body.key}, function(err) {
        if (err) next(err);
        else res.status(200).json({'message': 'Successfully deleted.'});
    });
});

module.exports = router;
