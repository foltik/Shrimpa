const express = require('express');
const router = express.Router();

const ModelPath = '../../models/';
const User = require(ModelPath + 'User.js');

const verifyBody = require('../../util/verifyBody');
const authenticate = require('../../util/auth/authenticateRequest');



const getParams = [
    {name: 'username', type: 'string', optional: true},
    {name: 'displayname', type: 'string', optional: true}];

router.get('/get', authenticate('user.get'), verifyBody(getParams), async (req, res) => {
    let query = {};

    if (req.body.username)
        query.username = req.body.username;

    if (req.body.displayname)
        query.displayname = req.body.displayname;

    //const users = User.find(query, 'username displayname scope uploadCount uploadSize date banned');
    const users = await User.find(query);

    res.status(200).json(users);
});



const banParams = [{name: 'username', type: 'string'}];

router.post('/ban', authenticate('user.ban'), verifyBody(banParams), async (req, res) => {
    const user = await User.findOne({username: req.body.username});
    if (!user)
        return res.status(422).json({message: 'User not found.'});

    if (user.banned)
        return res.status(422).json({message: 'User already banned.'});

    user.banned = true;
    await user.save();

    res.status(200).json({message: 'User banned.'});
});



const unbanParams = [{name: 'username', type: 'string'}];

router.post('/unban', authenticate('user.unban'), verifyBody(unbanParams), async (req, res) => {
    const user = await User.findOne({username: req.body.username});
    if (!user)
        return res.status(422).json({message: 'User not found.'});

    if (!user.banned)
        return res.status(422).json({message: 'User not banned.'});

    user.banned = false;
    await user.save();

    res.status(200).json({message: 'User unbanned.'});
});

module.exports = router;