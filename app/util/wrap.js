// Wraps an async middleware function to catch promise rejection
exports.wrap = fn =>
    (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);