var index = require('./routes/index.js');
var home = require('./routes/home.js');
var upload = require('./routes/upload.js');
var view = require('./routes/view.js');
var auth = require('./routes/auth.js');
var register = require('./routes/register.js');
var login = require('./routes/login.js');
var panel = require('./routes/panel');

var fs = require('fs');
var path = require('path');
var jwt = require('express-jwt');
var jwtauth = jwt({
    secret: fs.readFileSync(path.join(__dirname, '../jwt.pem'), 'utf8'),
    userProperty: 'payload',
    getToken: function(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            // First check Authorization header
            return req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies['shimapan-token']) {
            // Get from cookies as fallback
            return req.cookies['shimapan-token'];
        }

        // no token received
        return null;
    }
});

module.exports = function(app) {
    app.use('/', index);
    app.use('/home', home);
    app.use('/v', view);
    app.use('/api/upload', jwtauth, upload);
    app.use('/api/auth', auth);
    app.use('/register', register);
    app.use('/login', login);
    app.use('/panel', jwtauth, panel);
    app.use('/panel*', jwtauth, panel);

    app.use(function(err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            res.status(401);
            res.json({"message": err.name + ": " + err.message});
        }
    })
};