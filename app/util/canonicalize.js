// Normalizes, decomposes, and lowercases a utf-8 string
exports.canonicalize = (username) => username.normalize('NFKD').toLowerCase();

exports.canonicalizeRequest =
    (req, res, next) => {
        req.body.canonicalname = exports.canonicalize(req.body.username);
        next();
    };