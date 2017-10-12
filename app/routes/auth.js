var fs = require('fs');
var path = require('path');

var express = require('express');
var router = express.Router();
var async = require('async');

var User = require('../models/User.js');
var Invite = require('../models/Invite.js');

var passport = require('passport');

function checkUsername(username, callback) {
    User.find({username: username}).limit(1).count(function(err, count) {
        if (err) return callback(err);
        count === 0 ? callback(null, true) : callback(null, false);
    });
}

function checkInvite(code, callback) {
    Invite.findOne({code: code}, function(err, invite) {
        if (err) return callback(err);
        if (!invite || invite.used || invite.exp < new Date())
            callback(null, false);
        else
            callback(null, true, invite);
    });
}

function useInvite(code, username) {
    Invite.updateOne({code: code}, {recipient: username, used: new Date()}, function(err, res) {
        if (err) throw err;
    });
}

router.post('/register', function(req, res) {
    // Validate the parameters
    async.parallel({
        username: function(callback) {
            checkUsername(req.body.username, function(err, valid) {
                callback(err, valid);
            });
        },
        invite: function(callback) {
            checkInvite(req.body.invite, function(err, valid, invite) {
                callback(err, {valid: valid, invite: invite});
            });
        }
    }, function(err, result) {
        if (!result.username) {
            res.status(401).json({'message': 'Username in use.'});
        } else if (!result.invite.valid) {
            res.status(401).json({'message': 'Invalid invite code.'});
        } else {
            useInvite(req.body.invite, req.body.username);

            var user = new User();
            user.username = req.body.username;
            user.scope = result.invite.scope;
            user.date = new Date();
            user.setPassword(req.body.password);

            user.save(function(err) {
                if (err)
                    res.status(500).json({'message': 'Internal server error.'});
                else
                    res.status(200).json({'token': user.genJwt()});
            })
        }
    });
});

router.post('/login', function(req, res) {
    passport.authenticate('local', function(err, user, info) {
        if (err)
            res.status(500).json(err);
        else if (user)
            res.status(200).json({'token': user.genJwt() });
        else
            res.status(401).json(info);

    })(req, res);
});


module.exports = router;