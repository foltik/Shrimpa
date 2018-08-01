const sanitizer = require('sanitizer');

// Verifies a single property is well formed
const verifyProp = (prop, expected) => new Promise((resolve, reject) => {
    if (!expected.optional && !prop)
        return reject({code: 400, message: expected.name + ' not specified.'});

    if (prop && expected.type && typeof prop !== expected.type)
        return reject({code: 400, message: expected.name + ' malformed.'});

    if (prop && expected.instance && !(prop instanceof expected.instance))
        return reject({code: 400, message: expected.name + ' malformed.'});

    if (prop && expected.maxLength && prop.length > expected.maxLength)
        return reject({code: 400, message: expected.name + ' too long.'});

    if (prop && expected.sanitize && sanitizer.sanitize(prop) !== prop)
        return reject({code: 400, message: expected.name + ' contains invalid characters.'});

    if (prop && expected.restrict && prop.replace(expected.restrict, '') !== prop)
        return reject({code: 400, message: expected.name + ' contains invalid characters.'});

    resolve();
});

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