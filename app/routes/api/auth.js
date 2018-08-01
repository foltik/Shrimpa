const express = require('express');
const router = express.Router();
const config = require('config');

const ModelPath = '../../models/';
const User = require(ModelPath + 'User.js');
const Invite = require(ModelPath + 'Invite.js');

const passport = require('passport');

const canonicalizeRequest = require('../../util/canonicalize').canonicalizeRequest;
const requireAuth = require('../../util/auth').requireAuth;
const wrap = require('../../util/wrap.js');
const verifyBody = require('../../util/verifyBody');

// Wraps passport.authenticate to return a promise
const authenticate = (req, res, next) => {
    return new Promise((resolve) => {
        passport.authenticate('local', (err, user) => {
            resolve(user);
        })(req, res, next);
    });
};

// Wraps passport session creation for async usage
const login = (user, req) => {
    return new Promise((resolve) => {
        req.login(user, resolve);
    });
};

// Query the database for a valid invite code. An error message property is set if invalid.
const validateInvite = wrap(async (req, res, next) => {
    const invite = await Invite.findOne({code: req.body.invite}).catch(next);

    if (!invite)
        return res.status(422).json({message: 'Invalid invite code.'});

    if (invite.used)
        return res.status(422).json({message: 'Invite already used.'});

    if (invite.expires != null && invite.expires < Date.now())
        return res.status(422).json({message: 'Invite expired.'});

    req.invite = invite;
    next();
});

// Check if the requested username is valid
const validateUsername = wrap(async (req, res, next) => {
    const username = req.body.username;

    if (username.length > config.get('User.Username.maxLength'))
        return res.status(422).json({message: 'Username too long.'});

    const restrictedRegex = new RegExp(config.get('User.Username.restrictedChars'), 'g');
    if (username !== req.sanitize(username).replace(restrictedRegex, ''))
        return res.status(422).json({message: 'Username contains invalid characters.'});

    const count = await User.countDocuments({username: username}).catch(next);
    if (count !== 0)
        return res.status(422).json({message: 'Username in use.'});

    next();
});

const registerProps = [
    {name: 'displayname', type: 'string'},
    {name: 'password', type: 'string'},
    {name: 'invite', type: 'string'}];
router.post('/register',
    verifyBody(registerProps), canonicalizeRequest,
    validateInvite, validateUsername,
    wrap(async (req, res, next) => {
    // Update the database
    await Promise.all([
        User.register({
            username: req.body.username,
            displayname: req.body.displayname,
            scope: req.invite.scope,
            date: Date.now()
        }, req.body.password).catch(next),
        Invite.updateOne({code: req.invite.code}, {recipient: req.body.username, used: Date.now()}).catch(next)
    ]);

    res.status(200).json({'message': 'Registration successful.'});
}));

const loginProps = [
    {name: 'username', type: 'string', optional: true},
    {name: 'displayname', type: 'string', optional: true},
    {name: 'password', type: 'string'}];
router.post('/login', verifyBody(loginProps), canonicalizeRequest, wrap(async (req, res, next) => {
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
    if (!req.isAuthenticated())
        return res.status(400).json({message: 'Not logged in.'});

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