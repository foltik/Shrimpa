// Normalizes, decomposes, and lowercases a utf-8 string
exports.canonicalize = displayname => displayname.normalize('NFKD').toLowerCase();

exports.canonicalizeRequest =
    (req, res, next) => {
        if (req.body.displayname)
            req.body.username = exports.canonicalize(req.body.displayname);
        else if (req.body.username)
            req.body.username = exports.canonicalize(req.body.username);
        next();
    };