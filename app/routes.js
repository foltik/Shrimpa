var index = require('./routes/index.js');
var upload = require('./routes/upload.js');
var view = require('./routes/view.js');
var auth = require('./routes/auth.js');
var register = require('./routes/register.js');
var login = require('./routes/login.js');

var fs = require('fs');
var path = require('path');
var jwt = require('express-jwt');
var jwtauth = jwt({
    secret: fs.readFileSync(path.join(__dirname, '../jwt.pem'), 'utf8'),
    userProperty: 'payload'
});

module.exports = function(app) {
    app.use('/', index);
    app.use('/v', view);
    app.use('/upload', upload);
    app.use('/api/auth', auth);
    app.use('/register', register);
    app.use('/login', login);

    app.use(function(err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            res.status(401);
            res.json({"message": err.name + ": " + err.message});
        }
    })
};