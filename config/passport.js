var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');
var User = require('../app/models/User.js');

passport.use(new LocalStrategy({
        usernameField: 'username'
    },
    function(username, password, done) {
        User.findOne({username: username}, function(err, user) {
            if (err) return done(err);

            if (!user) {
                return done(null, false, {
                    message: 'Invalid username.'
                });
            }

            if (!user.validatePassword(password)) {
                return done(null, false, {
                    message: 'Invalid password.'
                });
            }

            return done(null, user);
        });
    }
));