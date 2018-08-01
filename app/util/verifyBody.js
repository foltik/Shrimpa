// Verifies a single property is well formed
const verifyProp = (req, expected) => new Promise((resolve, reject) => {
    const prop = req.body[expected.name];

    if (!expected.optional && !prop)
        return reject({code: 400, message: expected.name + ' not specified.'});

    if (prop && expected.type && typeof prop !== expected.type)
        return reject({code: 400, message: expected.name + ' malformed.'});

    if (prop && expected.instance && !(prop instanceof expected.instance))
        return reject({code: 400, message: expected.name + ' malformed.'});

    if (prop && expected.maxLength && prop.length > expected.maxLength)
        return reject({code: 422, message: expected.name + ' too long.'});

    if (prop && expected.sanitize && req.sanitize(prop) !== prop)
        return reject({code: 422, message: expected.name + ' contains invalid characters.'});

    if (prop && expected.restrict && prop.replace(expected.restrict, '') !== prop)
        return reject({code: 422, message: expected.name + ' contains invalid characters.'});

    resolve();
});

// Verifies the entire request body is well formed
// expectedProps follows the format:
// [{name: 'myList', instance: 'Array'}, {name: 'myVar', type: 'string', optional: true}, etc.]
const verifyBody = expectedProps =>
    (req, res, next) => {
        Promise.all(expectedProps.map(expected => verifyProp(req, expected)))
            .then(() => next())
            .catch(err => res.status(err.code).json({message: err.message}));
    };

module.exports = verifyBody;