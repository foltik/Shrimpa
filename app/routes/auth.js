var fs = require('fs');
var path = require('path');

var express = require('express');
var router = express.Router();

var User = require('../models/User.js');
var Invite = require('../models/Invite.js');

var passport = require('passport');

function checkInvite(code, callback) {
    Invite.findOne({code: code}, function (err, invite) {
        if (err) return callback(err);
        if (!invite || invite.used || invite.exp < new Date())
            callback(null, false);
        else
            callback(null, true, invite);
    });
}

function useInvite(code, username) {
    Invite.updateOne({code: code}, {recipient: username, used: new Date()}, function (err) {
        if (err) throw err;
    });
}

router.post('/register', function (req, res, next) {
    // Validate the invite code, then hand off to passport
    checkInvite(req.body.invite, function (err, valid, invite) {
        if (valid) {
            User.register(
                new User({username: req.body.username, scope: invite.scope, date: Date.now()}),
                req.body.password,
                function (err) {
                    if (err) return res.status(403).json({'message': err.message});
                    passport.authenticate('local')(req, res, function () {
                        req.session.save(function(err) {
                            if (err) return next(err);
                            useInvite(req.body.invite, req.body.username);
                            res.status(200).json({'message': 'Registered.'});
                        });
                    });
                }
            );
        } else {
            res.status(401).json({'message': 'Invalid invite code.'});
        }
    });
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) return next(err);
        if (!user) return res.status(401).json({'message': info});
        req.logIn(user, function(err) {
            if (err) return next(err);
            res.status(200).json({'message': 'Logged in.'});
        });
    })(req, res, next);
});

router.get('/logout', function (req, res) {
    req.logout();
    res.status(200).json({'message': 'Logged out.'});
});

router.get('/session', function(req, res) {
   if (req.session.passport.user) {
       User.findOne({username: req.session.passport.user}, function(err, user) {
           res.status(200).json({
               user: user.username,
               scope: user.scope
           });
       });
   } else {
       res.status(401).json({'message': 'Unauthorized.'});
   }
});

module.exports = router;