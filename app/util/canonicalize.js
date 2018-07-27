// Normalizes, decomposes, and lowercases a utf-8 string
exports.canonicalize = displayname => displayname.normalize('NFKD').toLowerCase();

exports.canonicalizeRequest =
    (req, res, next) => {
        req.body.username = req.body.displayname ? exports.canonicalize(req.body.displayname) : undefined;
        next();
    };