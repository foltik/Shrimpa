var index = require('./routes/index.js');
var home = require('./routes/home.js');
var upload = require('./routes/upload.js');
var view = require('./routes/view.js');
var auth = require('./routes/auth.js');
var register = require('./routes/register.js');
var login = require('./routes/login.js');
var panel = require('./routes/panel.js');
var keys = require('./routes/keys.js');

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