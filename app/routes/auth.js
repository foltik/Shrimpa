var fs = require('fs');
var path = require('path');

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');
var Invite = require('../models/Invite.js');

var passport = require('passport');

function validUsername(username, callback) {
    User.find({username: username}).limit(1).count(function(err, count) {
        if (err) return callback(err);
        count === 0 ? callback(null, true) : callback(null, false);
    });
}

function useInvite(code, user, callback) {
    Invite.findOne({code: code}, function(err, invite) {
        if (err) return callback(err);
        if (!invite || invite.used) {
            return callback(null, false, null);
        } else {
            Invite.updateOne({code: code}, {recipient: user, used: Date.now()}, function(err, res) {
                if (err) throw err;
            });
            callback(null, true, invite);
        }
    })
}

router.post('/register', function(req, res) {
    // Check the username
    validUsername(req.body.username, function(err, valid) {
        if (!valid) {
            res.status(401).json({'message': 'Username in use.'});
            return;
        }

        // Check and use the invite
        useInvite(req.body.invite, req.body.username, function(err, valid, invite) {
            if (!valid) {
                res.status(401).json({'message': 'Invalid invite code.'});
                return;
            }

            var user = new User();
            user.username = req.body.username;
            user.level = invite.level;
            user.date = Date.now();
            user.genApiKey();
            user.setPassword(req.body.password);

            user.save(function(err) {
                if (err) {
                    res.status(500).json({'message': 'Internal server error'});
                } else {
                    var token = user.genJwt();
                    res.status(200).json({'token': token});
                }
            })
        })
    });
});

router.post('/login', function(req, res) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            res.status(404).json(err);
            return;
        }

        var token;
        if (user) {
            token = user.genJwt();
            res.status(200).json({'token': token });
        } else {
            res.status(401).json(info);
        }
    })(req, res);
});


module.exports = router;