const sanitizer = require('sanitizer');

// Verifies a single property is well formed
const verifyProp = async (prop, expected) => {
    if (!expected.optional && !prop)
        throw {code: 400, message: expected.name + ' not specified.'};
    else if (!prop)
        return;

    if (expected.type) {
        if (expected.type === 'date' && isNaN(new Date(prop)))
            throw {code: 400, message: `${expected.name} malformed.`};
        else if (expected.type === 'array' && !(prop instanceof Array))
            throw {code: 400, message: `${expected.name} malformed.`};
        else if (typeof prop !== expected.type)
            throw {code: 400, message: `${expected.name} malformed.`};
    }

    if (expected.min && prop < expected.min)
        throw {code: 400, message: `${expected.name} too small.`};

    if (expected.max && prop > expected.max)
        throw {code: 400, message: `${expected.name} too large.`};

    if (expected.maxLength && prop.length > expected.maxLength)
        throw {code: 400, message: `${expected.name} too long.`};

    if (expected.sanitize && sanitizer.sanitize(prop) !== prop)
        throw {code: 400, message: `${expected.name} contains invalid characters.`};

    if (expected.restrict && prop.replace(expected.restrict, '') !== prop)
        throw {code: 400, message: `${expected.name} contains invalid characters.`};
};

// Verifies the entire request body is well formed
// expectedProps follows the format:
// [{name: 'myList', instance: 'Array'}, {name: 'myVar', type: 'string', optional: true}, etc.]
const verifyBody = (body, expectedProps) =>
    Promise.all(expectedProps.map(expected => verifyProp(body[expected.name], expected)));

const bodyVerifier = expectedProps =>
    (req, res, next) => {
        verifyBody(req.body, expectedProps)
            .then(() => next())
            .catch(err => res.status(err.code).json({message: err.message}));
    };

exports.verifyBody = verifyBody;
exports.bodyVerifier = bodyVerifier;