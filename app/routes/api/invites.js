const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const ModelPath = '../../models/';
const Invite = require(ModelPath + 'Invite.js');
const User = require(ModelPath + 'User.js');

const wrap = require('../../util/wrap.js');
const requireAuth = require('../../util/auth').requireAuth;
const verifyScope = require('../../util/verifyScope');
const verifyBody = require('../../util/verifyBody');


const updateInviteCount = async (req, next) =>
    User.updateOne({username: req.username}, {$inc: {inviteCount: 1}}).catch(next);

const verifyUserHasScope = userScope =>
    scope => verifyScope(userScope, scope);

const createParams = [{name: 'scope', instance: Array}];
router.post('/create', requireAuth('invite.create'), verifyBody(createParams), wrap(async (req, res, next) => {
    const scope = req.body.scope;
    const hasPermission = scope.every(verifyUserHasScope(req.scope));
    if (!hasPermission)
        return res.status(403).json({message: 'Requested scope exceeds own scope.'});

    const invite = {
        code: crypto.randomBytes(12).toString('hex'),
        scope: scope,
        issuer: req.username,
        issued: Date.now(),
        expires: req.body.expires
    };

    await Promise.all([
        Invite.create(invite).catch(next),
        updateInviteCount(req, next)
    ]);

    res.status(200).json({
        message: 'Invite created.',
        code: invite.code
    });
}));

const deleteParams = [{name: 'code', type: 'string'}];
router.post('/delete', requireAuth('invite.delete'), verifyBody(deleteParams), wrap(async (req, res, next) => {
    let query = {code: req.body.code};

    // Users need a permission to delete invites other than their own
    if (!verifyScope(req.scope, 'invite.delete.others'))
        query.issuer = req.username;

    // Find the invite
    const invite = await Invite.findOne(query).catch(next);
    if (!invite)
        return res.status(404).json({message: 'Invite not found.'});

    // Users need a permission to delete invites that have been used
    if (!verifyScope(req.scope, 'invite.delete.used') && invite.used != null && invite.recipient != null)
        return res.status(403).json({message: 'Forbidden to delete used invites.'});

    await Invite.deleteOne({_id: invite._id}).catch(next);
    res.status(200).json({message: 'Invite deleted.'});
}));

const getParams = [{name: 'code', type: 'string', optional: true}];
router.get('/get', requireAuth('invite.get'), verifyBody(getParams), wrap(async (req, res, next) => {
    let query = {};

    // Users need a permission to list invites other than their own
    if (!verifyScope(req.scope, 'invite.get.others'))
        query.issuer = req.username;

    // Narrow down the query by code if specified
    if (req.body.code)
        query.code = req.body.code;

    const invites = await Invite.find(query).catch(next);
    res.status(200).json(invites);
}));

module.exports = router;