'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Invite = require('../models/Invite.js');
const passport = require('passport');

const canonicalizeRequest = require('../util/canonicalize').canonicalizeRequest;
const requireAuth = require('../util/requireAuth').requireAuth;

// Wraps an async middleware to catch promise rejection
function asyncMiddleware(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}

// Wraps passport.authenticate to return a promise
function authenticate(req, res, next) {
    return new Promise((resolve) => {
        passport.authenticate('local', (err, user) => {
            resolve(user);
        })(req, res, next);
    });
}

// Wraps passport session creation for async usage
function login(user, req) {
    return new Promise((resolve) => {
        req.login(user, resolve);
    });
}

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


router.post('/register', canonicalizeRequest, asyncMiddleware(async (req, res, next) => {
    // Validate the invite and username
    const [inviteStatus, usernameStatus] =
        await Promise.all([
            validateInvite(req.body.invite),
            validateUsername(req.body.username, req.body.canonicalname, req.sanitize)
        ]);

    // Error if validation failed
    if (!inviteStatus.valid)
        return res.status(422).json({'message': inviteStatus.message});
    if (!usernameStatus.valid)
        return res.status(422).json({'message': usernameStatus.message});

    // Update the database
    await Promise.all([
        User.register({
            username: req.body.username,
            canonicalname: req.body.canonicalname,
            scope: inviteStatus.invite.scope,
            date: Date.now()
        }, req.body.password),
        Invite.updateOne({code: inviteStatus.invite.code}, {recipient: req.body.canonicalname, used: Date.now()})
    ]);

    res.status(200).json({'message': 'Registration successful.'});
}));

router.post('/login', canonicalizeRequest, asyncMiddleware(async (req, res, next) => {
    // Authenticate
    const user = await authenticate(req, res, next);
    if (!user)
        return res.status(401).json({'message': 'Unauthorized.'});

    // Create session
    await login(user, req);

    // Set scope
    req.session.passport.scope = user.scope;

    res.status(200).json({'message': 'Logged in.'});
}));

router.get('/logout', function (req, res) {
    req.logout();
    res.status(200).json({'message': 'Logged out.'});
});

router.get('/session', requireAuth, (req, res, next) => {
    res.status(200).json({
        username: req.session.passport.username,
        canonicalname: req.session.passport.canonicalname,
        scope: req.session.passport.scope
    });
});

module.exports = router;