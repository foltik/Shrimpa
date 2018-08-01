var express = require('express');
var router = express.Router();

var User = require('../../models/User.js');

var requireScope = function (perm) {
    return function(req, res, next) {
        User.findOne({username: req.session.passport.user}, function(err, user) {
            if (err) throw err;
            if (user.scope.indexOf(perm) === -1)
                res.status(400).json({'message': 'No permission.'});
            else
                next();
        });
    }
};

router.get('/get', requireScope('users.view'), function (req, res, next) {
    var query = {};

    if (req.body.username)
        query.username = req.body.username;

    User.find(query, function (err, users) {
        if (err) {
            next(err)
        } else {
            res.status(200).json(users);
        }
    })
});

module.exports = router;