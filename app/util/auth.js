const ModelPath = '../models/';
const Key = require(ModelPath + 'Key.js');
const User = require(ModelPath + 'User.js');

const fs = require('fs').promises;
const wrap = require('./wrap.js');
const verifyScope = require('./verifyScope.js');

const checkSession = (req, scope, status) => {
    if (req.isAuthenticated()) {
        status.authenticated = true;
        if (!scope || verifyScope(req.session.passport.scope, scope)) {
            req.username = req.session.passport.user;
            req.displayname = req.session.passport.displayname;
            req.scope = req.session.passport.scope;
            req.key = null;
            status.permission = true;
        }
    }
};

const checkKey = async (req, scope, status) => {
    if (req.body.key) {
        const key = await Key.findOne({key: req.body.key});
        if (key) {
            status.authenticated = true;
            if (!scope || verifyScope(key.scope, scope)) {
                req.username = key.issuer;
                req.displayname = key.issuer;
                req.scope = key.scope;
                req.key = key.key;
                status.permission = true;
            }
        } else {
            // Log failure
            await fs.appendFile('auth.log', `${new Date().toISOString()} key ${req.connection.remoteAddress}\n`);
        }
    }
};

// Middleware that checks for authentication by either API key or session
// sets req.username, req.displayname, req.scope, and req.key if authenticated properly,
// otherwise throws an error code.
// If the user is banned, also throw an error.
const requireAuth = scope =>
    wrap(async (req, res, next) => {
        const status = {
            authenticated: false,
            permission: false
        };

        // First, check the session
        checkSession(req, scope, status);
        // If not authenticated yet, check for a key
        if (!status.authenticated)
            await checkKey(req, scope, status);

        if (!status.authenticated)
            return res.status(401).json({message: 'Unauthorized.'});
        else if (!status.permission)
            return res.status(403).json({message: 'Forbidden.'});

        // Check if the user is banned
        const user = await User.findOne({username: req.username});
        if(user && user.banned)
            return res.status(403).json({message: 'Forbidden.'});

        next();
    });

module.exports.checkSession = checkSession;
module.exports.checkKey = checkKey;
module.exports.requireAuth = requireAuth;
