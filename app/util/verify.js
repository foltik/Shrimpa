const sanitizer = require('sanitizer');

// Verifies a single property is well formed.
// expected follows the format:
// ex. {name: 'myList', type: 'array', maxLength: 10}
// ex. {name: 'myVar', type: 'string', optional: true}
const verify = async (prop, expected) => {
    if (!expected.optional && !prop)
        throw {code: 400, message: expected.name + ' not specified.'};
    else if (!prop)
        return;

    if (expected.type) {
        if (expected.type === 'date') {
            if (isNaN(new Date(prop)))
                throw {code: 400, message: `${expected.name} malformed.`};
        } else if (expected.type === 'array') {
            if (!(prop instanceof Array))
                throw {code: 400, message: `${expected.name} malformed.`};
        } else if (expected.type === 'number') {
            if (isNaN(parseInt(prop)))
                throw {code: 400, message: `${expected.name} malformed.`};
        } else {
            if (typeof prop !== expected.type)
                throw {code: 400, message: `${expected.name} malformed.`};
        }
    }


    if (expected.min && parseInt(prop) < expected.min)
        throw {code: 400, message: `${expected.name} too small.`};

    if (expected.max && parseInt(prop) > expected.max)
        throw {code: 400, message: `${expected.name} too large.`};

    if (expected.maxLength && prop.length > expected.maxLength)
        throw {code: 400, message: `${expected.name} too long.`};

    if (expected.sanitize && sanitizer.sanitize(prop) !== prop)
        throw {code: 400, message: `${expected.name} contains invalid characters.`};

    if (expected.restrict && prop.replace(expected.restrict, '') !== prop)
        throw {code: 400, message: `${expected.name} contains invalid characters.`};
};

module.exports = verify;