const verify = require('./verify.js');

// Verifies the entire request query is well formed
const verifyQuery = expected => async (req, res, next) => {
    try {
        await Promise.all(expected.map(e => verify(req.query[e.name], e)));
        next();
    } catch(err) {
        res.status(err.code).json({message: err.message});
    }
};

module.exports = verifyQuery;
