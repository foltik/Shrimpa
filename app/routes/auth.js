const express = require('express');
const router = express.Router();
const config = require('config');

const ModelPath = '../models/';
const User = require(ModelPath + 'User.js');
const Invite = require(ModelPath + 'Invite.js');

const passport = require('passport');

const canonicalizeRequest = require('../util/canonicalize').canonicalizeRequest;
const requireAuth = require('../util/requireAuth');
const wrap = require('../util/wrap.js');

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

// Check if the requested username is valid
async function validateUsername(username, sanitize) {
    if (username.length > config.get('User.Username.maxLength'))
        return {valid: false, message: 'Username too long.'};

    const restrictedRegex = new RegExp(config.get('User.Username.restrictedChars'), 'g');
    if (username !== sanitize(username).replace(restrictedRegex, ''))
        return {valid: false, message: 'Username contains invalid characters.'};

    const count = await User.countDocuments({username: username});

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

    if (invite.exp != null && invite.exp < Date.now())
        return {valid: false, message: 'Invite expired.'};

    return {valid: true, invite: invite};
}


router.post('/register', canonicalizeRequest, wrap(async (req, res) => {
    // Validate the invite and username
    const [inviteStatus, usernameStatus] =
        await Promise.all([
            validateInvite(req.body.invite),
            validateUsername(req.body.username, req.sanitize)
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
            displayname: req.body.displayname,
            scope: inviteStatus.invite.scope,
            date: Date.now()
        }, req.body.password),
        Invite.updateOne({code: inviteStatus.invite.code}, {recipient: req.body.username, used: Date.now()})
    ]);

    res.status(200).json({'message': 'Registration successful.'});
}));

router.post('/login', canonicalizeRequest, wrap(async (req, res, next) => {
    // Authenticate
    const user = await authenticate(req, res, next);
    if (!user)
        return res.status(401).json({'message': 'Unauthorized.'});

    // Create session
    await login(user, req);

    // Set session vars
    req.session.passport.displayname = user.displayname;
    req.session.passport.scope = user.scope;

    res.status(200).json({'message': 'Logged in.'});
}));

router.post('/logout', function (req, res) {
    req.logout();
    res.status(200).json({'message': 'Logged out.'});
});

router.get('/whoami', requireAuth(), (req, res) => {
    res.status(200).json({
        user: req.username,
        display: req.displayname,
        scope: req.scope,
        key: req.key
    });
});

module.exports = router;