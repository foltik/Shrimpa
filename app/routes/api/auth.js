const express = require('express');
const router = express.Router();
const config = require('config');
const fs = require('fs').promises;
const passport = require('passport');

const canonicalize = require('../../util/auth/canonicalize');

const ModelPath = '../../models/';
const User = require(ModelPath + 'User.js');
const Invite = require(ModelPath + 'Invite.js');


const authenticate = require('../../util/auth/authenticateRequest');
const verifyBody = require('../../util/verifyBody');
const rateLimit = require('../../util/rateLimit');

// Wraps passport.authenticate to return a promise
const passportAuthenticate = (req, res, next) => {
    return new Promise((resolve) => {
        passport.authenticate('local', (err, user) => {
            resolve(user);
        })(req, res, next);
    });
};

// Wraps passport session creation to return a promise
const passportLogin = (user, req) => {
    return new Promise((resolve) => {
        req.login(user, resolve);
    });
};

const registerParams = [
    {name: 'displayname', type: 'string', maxLength: config.get('User.Username.maxLength'), sanitize: true, restrict: new RegExp(config.get('User.Username.restrictedChars'))},
    {name: 'password', type: 'string'},
    {name: 'invite', type: 'string'}];

router.post('/register',
    rateLimit(config.get('RateLimit.register.window'), config.get('RateLimit.register.max'), true),
    verifyBody(registerParams),
    async (req, res) => {
        const username = canonicalize(req.body.displayname);

        // Retrieve invite and username status
        const [invite, usernameCount] = await Promise.all([
            Invite.findOne({code: req.body.invite}),
            User.countDocuments({username: username})
        ]);

        // Validate the invite
        if (!invite)
            return res.status(422).json({message: 'Invalid invite code.'});
        if (invite.used)
            return res.status(422).json({message: 'Invite already used.'});
        if (invite.expires != null && invite.expires < Date.now())
            return res.status(422).json({message: 'Invite expired.'});

        // Validate the username
        if (usernameCount !== 0)
            return res.status(422).json({message: 'Username in use.'});

        // Create the user object
        await User.register({
            username: username,
            displayname: req.body.displayname,
            scope: invite.scope,
            date: Date.now()
        }, req.body.password);

        // Update the invite as used
        await Invite.updateOne({code: invite.code}, {recipient: username, used: Date.now()});

        res.status(200).json({'message': 'Registration successful.'});
    });



const loginParams = [
    {name: 'displayname', type: 'string'},
    {name: 'password', type: 'string'}];

router.post('/login',
    rateLimit(config.get('RateLimit.login.window'), config.get('RateLimit.login.max'), true),
    verifyBody(loginParams),
    async (req, res, next) => {
        req.body.username = canonicalize(req.body.displayname);

        // Authenticate
        const user = await passportAuthenticate(req, res, next);
        if (!user) {
            // Log failure
            await fs.appendFile('auth.log', `${new Date().toISOString()} login ${req.ip}\n`);
            return res.status(401).json({'message': 'Unauthorized.'});
        }

        // Create session
        await passportLogin(user, req);

        // Set session vars
        req.session.passport.displayname = user.displayname;
        req.session.passport.scope = user.scope;

        res.status(200).json({'message': 'Logged in.'});
    });



router.post('/logout', (req, res) => {
    if (!req.isAuthenticated())
        return res.status(400).json({message: 'Not logged in.'});

    req.logout();
    res.status(200).json({'message': 'Logged out.'});
});



router.get('/whoami', authenticate(), (req, res) => {
    res.status(200).json({
        username: req.username,
        displayname: req.displayname,
        scope: req.scope,
        key: req.key
    });
});

module.exports = router;