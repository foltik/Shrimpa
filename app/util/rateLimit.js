const config = require('config');
const rateLimit = require('express-rate-limit');

const rateLimitRequest = (window, max, skipSuccessful) =>
    config.get('RateLimit.enable')
        ? rateLimit({windowMs: window * 1000, max: max, skipSuccessfulRequests: skipSuccessful})
        : (req, res, next) => { next(); };

module.exports = rateLimitRequest;
