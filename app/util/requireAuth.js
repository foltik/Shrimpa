const Key = require('../models/Key.js');
const wrap = require('./wrap.js').wrap;

const verifyScope = (scope, requiredScope) => scope.indexOf(requiredScope) !== -1;

// Checks for authentication by either API Key or Session
// Sets body.authUser and body.authKey if check passed
// If the request is authenticated and has the desired scope, continue.
// If the request is authenticated, but lacks the required scope, return 403 Forbidden.
// If the request is unauthenticated, return 401 Unauthorized.
exports.requireAuth = scope =>
    wrap(async (req, res, next) => {
        if (req.isAuthenticated()) {
            if (scope ? verifyScope(req.session.passport.scope, scope) : true) {
                req.authUser = req.session.passport.user;
                req.authDisplay = req.session.passport.display;
                req.authScope = req.session.passport.scope;
                req.authKey = null;
                next();
            } else {
                res.status(403).json({message: 'Forbidden.'});
            }
        } else if (req.body.apikey) {
            const key = await Key.findOne({key: apikey});
            if (scope ? verifyScope(key.scope, scope) : true) {
                req.authUser = key.username;
                req.authDisplay = key.username;
                req.authScope = key.scope;
                req.authKey = key.key;
                next();
            } else {
                res.status(403).json({message: 'Forbidden.'});
            }
        } else {
            res.status(401).json({'message': 'Unauthorized.'});
        }
    });