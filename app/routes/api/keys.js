const express = require('express');
const router = express.Router();
const config = require('config');
const crypto = require('crypto');

const ModelPath = '../../models/';
const Key = require(ModelPath + 'Key.js');

const wrap = require('../../util/wrap');
const bodyVerifier = require('../../util/verifyBody').bodyVerifier;
const verifyScope = require('../../util/verifyScope');
const requireAuth = require('../../util/auth').requireAuth;

const createParams = [
    {name: 'identifier', type: 'string', sanitize: true},
    {name: 'scope', instance: Array}];
router.post('/create', requireAuth('key.create'), bodyVerifier(createParams), wrap(async (req, res) => {
    const keyCount = await Key.countDocuments({issuer: req.username});
    if (keyCount >= config.get('Key.limit'))
        return res.status(403).json({message: 'Key limit reached.'});

    const scope = req.body.scope;
    if (!scope.every(scope => verifyScope(req.scope, scope)))
        return res.status(403).json({message: 'Requested scope exceeds own scope.'});

    const key = {
        key: await crypto.randomBytes(32).toString('hex'),
        identifier: req.body.identifier,
        scope: scope,
        issuer: req.username,
        date: Date.now()
    };

    await Key.create(key);

    res.status(200).json({
        message: 'Key created.',
        key: key.key
    });
}));

const getProps = [
    {name: 'identifier', type: 'string', optional: true},
    {name: 'issuer', type: 'string', optional: true}];
router.get('/get', requireAuth('key.get'), bodyVerifier(getProps), wrap(async (req, res) => {
    let query = {};

    if (req.body.identifier)
        query.identifier = req.body.identifier;

    if (!verifyScope(req.scope, 'key.get.others'))
        query.issuer = req.username;
    else if (req.body.issuer)
        query.issuer = req.body.issuer;

    const keys = await Key.find(query);

    res.status(200).json(keys);
}));

const deleteProps = [
    {name: 'key', type: 'string'},
    {name: 'issuer', type: 'string', optional: true}];
router.post('/delete', requireAuth('key.delete'), bodyVerifier(deleteProps), wrap(async (req, res) => {
    let query = {key : req.body.key};

    if (!verifyScope(req.scope, 'key.delete.others'))
        query.issuer = req.username;
    else if (req.body.issuer)
        query.issuer = req.body.issuer;

    const key = await Key.findOne(query);
    if (!key)
        return res.status(422).json({message: 'Key not found.'});

    await Key.deleteOne({_id: key._id});
    res.status(200).json({message: 'Key deleted.'});
}));

module.exports = router;
