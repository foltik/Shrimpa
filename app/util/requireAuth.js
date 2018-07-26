const Key = require('../models/Key.js');
const wrap = require('./wrap.js').wrap;

const verifyScope = (scope, requiredScope) => scope.indexOf(requiredScope) !== -1;
const getKeyScope = async apikey => (await Key.findOne({key: apikey})).scope;

exports.requireAuth = scope =>
    wrap(async (req, res, next) => {
        if (req.isAuthenticated() && (scope ? verifyScope(req.session.passport.scope, scope) : true))
            next();
        else if (req.body.apikey && (scope ? verifyScope(getKeyScope(req.body.apikey), scope) : true))
            next();
        else
            res.status(401).json({'message': 'Unauthorized.'});
    });