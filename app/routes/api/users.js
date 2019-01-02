const express = require('express');
const router = express.Router();

const ModelPath = '../../models/';
const User = require(ModelPath + 'User.js');

const wrap = require('../../util/wrap');
const verifyBody = require('../../util/verifyBody');
const requireAuth = require('../../util/auth').requireAuth;

const getParams = [
    {name: 'username', type: 'string', optional: true},
    {name: 'displayname', type: 'string', optional: true}];
router.get('/get', requireAuth('user.get'), verifyBody(getParams), wrap(async (req, res) => {
    let query = {};

    if (req.body.username)
        query.username = req.body.username;

    if (req.body.displayname)
        query.displayname = req.body.displayname;

    //const users = User.find(query, 'username displayname scope uploadCount uploadSize date banned');
    const users = await User.find(query);

    res.status(200).json(users);
}));

const banParams = [{name: 'username', type: 'string'}];
router.post('/ban', requireAuth('user.ban'), verifyBody(banParams), wrap(async (req, res) => {
    const user = await User.findOne({username: req.body.username});
    if (!user)
        return res.status(422).json({message: 'User not found.'});

    if (user.banned)
        return res.status(422).json({message: 'User already banned.'});

    user.banned = true;
    await user.save();

    res.status(200).json({message: 'User banned.'});
}));

const unbanParams = [{name: 'username', type: 'string'}];
router.post('/unban', requireAuth('user.unban'), verifyBody(unbanParams), wrap(async (req, res) => {
    const user = await User.findOne({username: req.body.username});
    if (!user)
        return res.status(422).json({message: 'User not found.'});

    if (!user.banned)
        return res.status(422).json({message: 'User not banned.'});

    user.banned = false;
    await user.save();

    res.status(200).json({message: 'User unbanned.'});
}));

module.exports = router;