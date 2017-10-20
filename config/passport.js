var passport = require('passport');
var User = require('../app/models/User.js');

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

