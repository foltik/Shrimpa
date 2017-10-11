var fs = require('fs');
var path = require('path');

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = mongoose.model('User');

var passport = require('passport');

router.post('/register', function(req, res) {
    console.log(req.body);

    var user = new User();
    user.username = req.body.username;
    user.level = 0;
    user.genApiKey();
    user.setPassword(req.body.password);

    user.save(function(err) {
        var token;
        token = user.genJwt();
        res.status(200);
        res.json({
            "token": token
        });
    });

});

router.post('/login', function(req, res) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            res.status(404).json(err);
            return;
        }

        var token;
        if (user) {
            token = user.genJwt();
            res.status(200);
            res.json({
                "token": token
            });
        } else {
            res.status(401).json(info);
        }
    })(req, res);
});


module.exports = router;