const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const describe = require('mocha').describe;

const verify = require('../app/util/verify.js');

describe('Body Verification', () => {
    const testVerify = async (prop, expected, code, message) => {
        try {
            await verify(prop, expected);
        } catch (err) {
            err.code.should.equal(code);
            err.message.should.equal(message);
        }
    };

    it('must continue properly with valid prop', () => {
        const tests = [{
            expected: {name: 'test'},
            prop: 'test'
        }, {
            expected: {name: 'test', type: 'array'},
            prop: ['1', '2', '3']
        }, {
            expected: {name: 'test', type: 'date'},
            prop: '11/12/2018'
        }, {
            expected: {name: 'test', type: 'number'},
            prop: '1546368715'
        }, {
            expected: {name: 'test', type: 'number', min: 12, max: 16},
            prop: '16'
        }];

        return Promise.all(tests.map(test => testVerify(test.prop, test.expected)));
    });

    it('must continue with a missing but optional prop', () =>
        testVerify(undefined, {name: 'test', optional: true}));

    it('must error with a missing prop', () =>
        testVerify(undefined, {name: 'test'}, 400, 'test not specified.'));

    it('must error with an invalid primitive type', () =>
        testVerify(['1', '2', '3'], {name: 'test', type: 'string'}, 400, 'test malformed.'));

    it('must error with an invalid date type', () =>
        testVerify('123abc', {name: 'test', type: 'date'}, 400, 'test malformed.'));

    it('must error with an invalid array type', () =>
        testVerify('test', {name: 'test', type: 'array'}, 400, 'test malformed.'));

    it('must error when smaller than the minimum', () =>
        testVerify('3', {name: 'test', type: 'number', min: 10}, 400, 'test too small.'));

    it('must error when larger than the maximum', () =>
        testVerify('15', {name: 'test', type: 'number', max: 10}, 400, 'test too large.'));

    it('must error with a length higher than the max', () =>
        testVerify('123456', {name: 'test', maxLength: 5}, 400, 'test too long.'));

    it('must error with a dirty prop that gets sanitized', () =>
        testVerify('test<svg/onload=alert("XSS")>', {name: 'test', sanitize: true}, 400, 'test contains invalid characters.'));

    it('must error with a restricted character', () =>
        testVerify('test test', {name: 'test', restrict: new RegExp("\\s")}, 400, 'test contains invalid characters.'));
});