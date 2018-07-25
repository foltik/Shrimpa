'use strict';

const express = require('express');
const router = express.Router();

const User = require('../models/User.js');
const Invite = require('../models/Invite.js');

const passport = require('passport');

const async = require('async');

function memoize(fn) {
    let cache = {};

    return async function() {
        let args = JSON.stringify(arguments);
        cache[args] = cache[args] || fn.apply(this, arguments);
        return cache[args];
    };
}

const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

// Normalizes, decomposes, and lowercases a utf-8 string
const canonicalizeUsername = username => username.normalize('NFKD').toLowerCase();

// Check if a canonical name is valid
async function validateUsername(username, canonicalName, sanitize) {
    if (canonicalName.length > 36)
        return {valid: false, message: 'Username too long.'};

    if (canonicalName !== sanitize(canonicalName).replace(/\s/g, ''))
        return {valid: false, message: 'Username contains invalid characters.'};

    const count = await User.countDocuments({canonicalname: canonicalName});

    if (count !== 0)
        return {valid: false, message: 'Username in use.'};

    return {valid: true};
}

// Query the database for a valid invite code. An error message property is set if invalid.
async function validateInvite(code) {
    const invite = await Invite.findOne({code: code});

    if (!invite)
        return {valid: false, message: 'Invalid invite code.'};

    if (invite.used)
        return {valid: false, message: 'Invite already used.'};

    if (invite.exp < Date.now())
        return {valid: false, message: 'Invite expired.'};

    return {valid: true, invite: invite};
}

// Authenticates and creates the required session variables
function setupSession(username, req, res, cb) {
    // Body needs to contain canonical name for proper authentication
    req.body.canonicalname = canonicalizeUsername(req.body.username);

    passport.authenticate('local')(req, res, function () {
        req.session.save(function (err) {
            if (!err) {
                req.session.passport.username = username;
                req.session.passport.canonicalname = canonicalizeUsername(username);
            }
            cb(err);
        });
    });
}

router.post('/register', asyncMiddleware(async (req, res, next) => {
    const reqUsername = req.body.username;
    const reqPassword = req.body.password;
    const reqInviteCode = req.body.invite;
    const canonicalName = canonicalizeUsername(reqUsername);

    // memoized verification functions
    const checkInvite = memoize(async () => validateInvite(reqInviteCode));
    const checkUsername = memoize(async () => validateUsername(reqUsername, canonicalName, req.sanitize));

    // Validate the invite and username
    const [inviteStatus, usernameStatus] = await Promise.all([checkInvite(), checkUsername()]);

    // Make sure invite was valid
    if (!inviteStatus.valid)
        return res.status(422).json({'message': inviteStatus.message});

    // Make sure the username was valid
    if (!usernameStatus.valid)
        return res.status(422).json({'message': usernameStatus.message});

    // Create the new user object
    const user = new User({
        username: reqUsername,
        canonicalname: canonicalName,
        scope: inviteStatus.invite.scope,
        date: Date.now()
    });

    // memoized password setting, user saving, and invite updating functions
    const updateInvite = memoize(async () =>
        Invite.updateOne({code: inviteStatus.invite.code}, {recipient: canonicalName, used: Date.now()}));
    const setPassword = memoize(async () => user.setPassword(reqPassword));
    const saveUser = memoize(async () => {
        await setPassword();
        return user.save();
    });

    // Set the password, save the user, and update the invite code
    await Promise.all([updateInvite(), setPassword(), saveUser()]);

    res.status(200).json({'message': 'Registration successful.'});
}));

router.post('/login', function (req, res, next) {
    // Take 'username' from the form and canonicalize it for authentication.
    req.body.canonicalname = canonicalizeUsername(req.body.username);

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
            req.session.passport.canonicalname = canonicalizeUsername(req.body.username);
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