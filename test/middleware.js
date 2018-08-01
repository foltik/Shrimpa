const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const describe = require('mocha').describe;

const verifyBody = require('../app/util/verifyBody').verifyBody;

describe('Body Verification', () => {
    const testVerifyBody = async (body, expected, code, message) => {
        try {
            await verifyBody(body, expected);
        } catch (err) {
            if (code)
                err.code.should.equal(code);
            if (message)
                err.message.should.equal(message);
        }
    };

    it('must continue properly with valid prop', () => {
        const expected = [{name: 'test'}];
        return testVerifyBody({test: 'test'}, expected);
    });

    it('must continue with a missing but optional prop', () => {
        const expected = [{name: 'test', optional: true}];
        return testVerifyBody({}, expected);
    });

    it('must error with a missing prop', () => {
        const expected = [{name: 'test'}];
        return testVerifyBody({}, expected, 400, 'test not specified.');
    });

    it('must error with an invalid type', () => {
        const expected = [{name: 'test', type: 'string'}];
        return testVerifyBody({test: [1, 2, 3]}, expected, 400, 'test malformed.');
    });

    it('must error with an invalid instance', () => {
        const expected = [{name: 'test', instance: Array}];
        return testVerifyBody({test: 'test'}, expected, 400, 'test malformed.');
    });

    it('must error with a length higher than the max', () => {
        const expected = [{name: 'test', maxLength: 5}];
        return testVerifyBody({test: '123456'}, expected, 400, 'test too long.');
    });

    it('must error with a dirty prop that gets sanitized', () => {
        const expected = [{name: 'test', sanitize: true}];
        return testVerifyBody({test: 'test<svg/onload=alert("XSS")>'}, expected, 400, 'test contains invalid characters.');
    });

    it('must error with a restricted character', () => {
        const expected = [{name: 'test', restrict: new RegExp("\\s")}];
        return testVerifyBody({test: 'test test'}, expected, 400, 'test contains invalid characters.');
    })
});