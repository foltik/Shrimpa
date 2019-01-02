const config = require('config');
const authenticate = require('./authenticate');
const rateLimit = require('../rateLimit');

const authenticateRequest = scope => (req, res, next) => {
    rateLimit(config.get('RateLimit.api.window'), config.get('RateLimit.api.max'))(req, res, async () => {
        const status = await authenticate(req, scope);
        if (status.authenticated) {
            if (status.permission) {
                next();
            } else res.status(403).json({message: 'Forbidden.'});
        } else res.status(401).json({message: 'Unauthorized.'});
    });
};

module.exports = authenticateRequest;