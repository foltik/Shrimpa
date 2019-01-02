const verify = require('./verify.js');

// Verifies the entire request body is well formed
const verifyBody = expected => async (req, res, next) => {
    try {
        await Promise.all(expected.map(e => verify(req.body[e.name], e)));
        next();
    } catch(err) {
        res.status(err.code).json({message: err.message});
    }
};

module.exports = verifyBody;
