// Wraps an async middleware function to catch promise rejection
const wrap = fn =>
    (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = wrap;