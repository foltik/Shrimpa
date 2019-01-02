const config = require('config');
const rateLimit = require('express-rate-limit');

const defaultSkipFn = (req, res) =>
    res.statusCode !== 401 && res.statusCode !== 403 && res.statusCode !== 422;

const rateLimitRequest = (window, max, skipFn) =>
    config.get('RateLimit.enable')
        ? rateLimit({windowMs: window * 1000, max: max, skip: skipFn || defaultSkipFn})
        : (req, res, next) => { next(); };

module.exports = rateLimitRequest;
