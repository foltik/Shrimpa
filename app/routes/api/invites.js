const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const ModelPath = '../../models/';
const Invite = require(ModelPath + 'Invite.js');
const User = require(ModelPath + 'User.js');

const authenticate = require('../../util/auth/authenticateRequest');
const verifyBody = require('../../util/verifyBody');



const createParams = [{name: 'scope', instance: Array}];

router.post('/create', authenticate('invite.create'), verifyBody(createParams), async (req, res, next) => {
    // Make sure the user has all the request scope
    const inviteScope = req.body.scope;
    if (!inviteScope.every(s => req.scope.includes(s)))
        return res.status(403).json({message: 'Requested scope exceeds own scope.'});

    const invite = {
        code: crypto.randomBytes(12).toString('hex'),
        scope: inviteScope,
        issuer: req.username,
        issued: Date.now(),
        expires: req.body.expires
    };

    await Promise.all([
        Invite.create(invite).catch(next),
        User.updateOne({username: req.username}, {$inc: {inviteCount: 1}})
    ]);

    res.status(200).json({
        message: 'Invite created.',
        code: invite.code
    });
});



const deleteParams = [{name: 'code', type: 'string'}];

router.post('/delete', authenticate('invite.delete'), verifyBody(deleteParams), async (req, res, next) => {
    let query = {code: req.body.code};

    // Users need a permission to delete invites other than their own
    if (!req.scope.includes('invite.delete.others'))
        query.issuer = req.username;

    // Find the invite
    const invite = await Invite.findOne(query).catch(next);
    if (!invite)
        return res.status(422).json({message: 'Invite not found.'});

    // Users need a permission to delete invites that have been used
    if (!req.scope.includes('invite.delete.used') && invite.used != null && invite.recipient != null)
        return res.status(403).json({message: 'Forbidden to delete used invites.'});

    await Invite.deleteOne({_id: invite._id}).catch(next);
    res.status(200).json({message: 'Invite deleted.'});
});



const getParams = [
    {name: 'code', type: 'string', optional: true},
    {name: 'issuer', type: 'string', optional: true}];

router.get('/get', authenticate('invite.get'), verifyBody(getParams), async (req, res, next) => {
    let query = {};

    // Users need a permission to list invites other than their own
    if (!req.scope.includes('invite.get.others'))
        query.issuer = req.username;
    else if (req.body.issuer)
        query.issuer = req.body.issuer;

    // Narrow down the query by code if specified
    if (req.body.code)
        query.code = req.body.code;

    const invites = await Invite.find(query).catch(next);
    res.status(200).json(invites);
});



module.exports = router;