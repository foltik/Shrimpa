var express = require('express');
var router = express.Router();

var User = require('../models/User.js');
var Invite = require('../models/Invite.js');

var passport = require('passport');

var async = require('async');

// Normalizes, decomposes, and lowercases a unicode string
function canonicalize(username) {
    return username.normalize('NFKD').toLowerCase();
}

// Checks if an invite code is valid
// Returns the invite object if valid
function checkInvite(code, cb) {
    Invite.findOne({code: code}, function (err, invite) {
        if (err)
            cb(err);
        else if (!invite)
            cb('Invalid invite code.');
        else if (invite.used)
            cb('Invite already used.');
        else if (invite.exp < Date.now())
            cb('Invite expired.');
        else
            cb(null, invite);
    });
}

// Validates the username, then registers the user in the database using the given invite.
function registerUser(username, password, invite, sanitizeFn, cb) {
    async.series([
        function (cb) {
            // Canonicalize and sanitize the username, checking for HTML
            var canonicalName = canonicalize(username);
            var sanitizedName = sanitizeFn(canonicalName);

            if (sanitizedName !== canonicalName)
                cb('Username failed sanitization check.');
            else if (canonicalName.length > 36)
                cb('Username too long.');
            else
                cb(null);
        },
        function (cb) {
            User.register(new User({
                username: username,
                canonicalname: canonicalize(username),
                scope: invite.scope,
                date: Date.now()
            }), password, cb);
        },
        function (cb) {
            invite.use(canonicalize(username), cb);
        }
    ], function (err) {
        cb(err);
    });
}

// Authenticates and creates the required session variables
function setupSession(username, req, res, cb) {
    // Body needs to contain canonical name for proper authentication
    req.body.canonicalname = canonicalize(req.body.username);

    passport.authenticate('local')(req, res, function () {
        req.session.save(function (err) {
            if (!err) {
                req.session.passport.username = username;
                req.session.passport.canonicalname = canonicalize(username);
            }
            cb(err);
        });
    });
}

router.post('/register', function (req, res) {
    async.waterfall([
        function (cb) {
            checkInvite(req.body.invite, cb);
        },
        function (invite, cb) {
            registerUser(req.body.username, req.body.password, invite, req.sanitize, cb);
        },
        function (cb) {
            setupSession(req.body.username, req, res, cb);
        }
    ], function (err) {
        if (err) {
            res.status(401).json({'message': err});
        } else {
            res.status(200).json({'message': 'Registration successful.'});
        }
    });
});

router.post('/login', function (req, res, next) {
    // Take 'username' from the form and canonicalize it for authentication.
    req.body.canonicalname = canonicalize(req.body.username);

    async.waterfall([
        function (cb) {
            passport.authenticate('local', function(err, user, info) {
                cb(err, user, info);
            })(req, res, next);
        },
        function (user, info, cb) {
            if (!user)
                cb(info);
            else
                req.logIn(user, cb);
        },
        function (cb) {
            req.session.passport.username = req.body.username;
            req.session.passport.canonicalname = canonicalize(req.body.username);
            cb();
        }
    ], function (err) {
        if (err)
            res.status(401).json({'message': err});
        else
            res.status(200).json({'message': 'Login successful.'});
    });
});

router.get('/logout', function (req, res) {
    req.logout();
    res.status(200).json({'message': 'Logged out.'});
});

router.get('/session', function (req, res) {
    console.log(req.session.passport);
    if (req.session.passport.canonicalname) {
        User.findOne({canonicalname: req.session.passport.canonicalname}, function (err, user) {
            res.status(200).json({
                username: user.username,
                canonicalname: user.canonicalname,
                scope: user.scope
            });
        });
    } else {
        res.status(401).json({'message': 'Unauthorized.'});
    }
});

module.exports = router;