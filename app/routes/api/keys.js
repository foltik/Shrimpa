const express = require('express');
const router = express.Router();
const config = require('config');
const crypto = require('crypto');

const ModelPath = '../../models/';
const Key = require(ModelPath + 'Key.js');

const verifyBody = require('../../util/verifyBody');
const authenticate = require('../../util/auth/authenticateRequest');



const createParams = [
    {name: 'identifier', type: 'string', sanitize: true},
    {name: 'scope', instance: Array}];

router.post('/create', authenticate('key.create'), verifyBody(createParams), async (req, res) => {
    const keyCount = await Key.countDocuments({issuer: req.username});
    if (keyCount >= config.get('Key.limit'))
        return res.status(403).json({message: 'Key limit reached.'});

    // Make sure the user has all the request scope
    const keyScope = req.body.scope;
    if (!keyScope.every(s => req.scope.includes(s)))
        return res.status(403).json({message: 'Requested scope exceeds own scope.'});

    const key = {
        key: await crypto.randomBytes(32).toString('hex'),
        identifier: req.body.identifier,
        scope: keyScope,
        issuer: req.username,
        date: Date.now()
    };

    await Key.create(key);

    res.status(200).json({
        message: 'Key created.',
        key: key.key
    });
});



const getProps = [
    {name: 'identifier', type: 'string', optional: true},
    {name: 'issuer', type: 'string', optional: true}];

router.get('/get', authenticate('key.get'), verifyBody(getProps), async (req, res) => {
    let query = {};

    if (req.body.identifier)
        query.identifier = req.body.identifier;

    if (!req.scope.includes('key.get.others'))
        query.issuer = req.username;
    else if (req.body.issuer)
        query.issuer = req.body.issuer;

    const keys = await Key.find(query);

    res.status(200).json(keys);
});



const deleteProps = [
    {name: 'keyid', type: 'string'},
    {name: 'issuer', type: 'string', optional: true}];

router.post('/delete', authenticate('key.delete'), verifyBody(deleteProps), async (req, res) => {
    let query = {key : req.body.keyid};

    if (!req.scope.includes('key.delete.others'))
        query.issuer = req.username;
    else if (req.body.issuer)
        query.issuer = req.body.issuer;

    const key = await Key.findOne(query);
    if (!key)
        return res.status(422).json({message: 'Key not found.'});

    await Key.deleteOne({_id: key._id});
    res.status(200).json({message: 'Key deleted.'});
});



module.exports = router;
