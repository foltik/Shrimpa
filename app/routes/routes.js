var index = require('./index.js');
var home = require('./home.js');
var upload = require('./upload.js');
var view = require('./view.js');
var auth = require('./auth.js');
var register = require('./register.js');
var login = require('./login.js');
var panel = require('./panel.js');
var keys = require('./keys.js');
var invites = require('./invites.js')

var Key = require('../models/Key.js');

var checkApiKey = function (key, cb) {
    Key.find({key: key}, function (err, res) {
        if (err) throw err;
        cb(res.length === 1);
    });
};

var requireLogin = function (req, res, next) {
    if (!req.session || !req.session.passport)
        return res.redirect('/login');
    else
        return next();
};

var requireLoginApi = function(req, res, next) {
    if (!req.session || !req.session.passport) {
        if (!req.body.apikey) {
            return res.redirect('/login');
        } else {
            checkApiKey(res.body.apikey, function(valid) {
                if (!valid)
                    return res.sendStatus(401);
                else
                    return next();
            });
        }
    } else {
        return next();
    }
};

module.exports = function (app) {
    app.use('/', index);
    app.use('/home', requireLogin, home);
    app.use('/v', view);
    app.use('/api/upload', upload);
    app.use('/api/auth', auth);
    app.use('/api/keys', requireLogin, keys);
    app.use('/api/invites', requireLogin, invites);
    app.use('/register', register);
    app.use('/login', login);
    app.use('/panel', requireLogin, panel);
    app.use('/panel*', requireLogin, panel);

    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            res.status(401);
            res.json({"message": err.name + ": " + err.message});
        }
    })
};