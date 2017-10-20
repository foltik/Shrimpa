var index = require('./index.js');
var home = require('./home.js');
var upload = require('./upload.js');
var view = require('./view.js');
var auth = require('./auth.js');
var register = require('./register.js');
var login = require('./login.js');
var panel = require('./panel.js');
var keys = require('./keys.js');

var fs = require('fs');
var path = require('path');

var requireLogin = function(req, res, next) {
    if (!req.session.passport.user)
        res.redirect('/login');
    else
        next();
};

module.exports = function(app) {
    app.use('/', index);
    app.use('/home', requireLogin, home);
    app.use('/v', view);
    app.use('/api/upload', upload);
    app.use('/api/auth', auth);
    app.use('/api/keys', requireLogin, keys);
    app.use('/register', register);
    app.use('/login', login);
    app.use('/panel', requireLogin, panel);
    app.use('/panel*', requireLogin, panel);

    app.use(function(err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            res.status(401);
            res.json({"message": err.name + ": " + err.message});
        }
    })
};