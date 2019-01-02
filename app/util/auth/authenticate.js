const ModelPath = '../../models/';
const Key = require(ModelPath + 'Key.js');
const User = require(ModelPath + 'User.js');

// Middleware that checks for authentication by either API key or session
// sets req.username, req.displayname, req.scope, and req.key if authenticated properly, otherwise throws an error.
// If the user is banned, also throw an error.
const authenticate = async (req, scope) => {
    const keyprop = req.body.key || req.query.key;
    let key = keyprop ? (await Key.findOne({key: keyprop})) : false;

    if (key) {
        if (!scope || key.scope.includes(scope)) {
            if ((await User.countDocuments({username: key.issuer, banned: true})) === 0) {
                req.username = key.issuer;
                req.displayname = key.issuer;
                req.scope = key.scope;
                req.key = key.key;
                return {authenticated: true, permission: true};
            } else return {authenticated: true, permission: false};
        } else return {authenticated: true, permission: false};
    } else if (req.isAuthenticated()) {
        if (!scope || req.session.passport.scope.includes(scope)) {
            if ((await User.countDocuments({username: req.session.passport.user, banned: true})) === 0) {
                req.username = req.session.passport.user;
                req.displayname = req.session.passport.displayname;
                req.scope = req.session.passport.scope;
                req.key = null;
                return {authenticated: true, permission: true};
            } else return {authenticated: true, permission: false};
        } else return {authenticated: true, permission: false};
    } else return {authenticated: false, permission: false};
};

module.exports = authenticate;
