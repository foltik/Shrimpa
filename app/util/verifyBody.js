
// Verifies the request body is well formed
// expectedProps follows the format:
// [{name: 'myList', instance: 'Array'}, {name: 'myVar', type: 'string', optional: true}, etc.]
const verifyBody = expectedProps =>
    (req, res, next) => {
        for (let i = 0; i < expectedProps.length; i++) {
            const expected = expectedProps[i];
            const prop = req.body[expected.name];

            if (!expected.optional && !prop)
                return res.status(400).json({message: expected.name + ' not specified.'});

            if (prop && expected.type && typeof prop !== expected.type)
                return res.status(400).json({message: expected.name + ' malformed.'});

            if (prop && expected.instance && !(prop instanceof expected.instance))
                return res.status(400).json({message: expected.name + ' malformed.'});
        }
        next();
    };

module.exports = verifyBody;