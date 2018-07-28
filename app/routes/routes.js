const index = require('./index.js');
const home = require('./home.js');
const upload = require('./upload.js');
const view = require('./view.js');
const auth = require('./auth.js');
const register = require('./register.js');
const login = require('./login.js');
const panel = require('./panel.js');
const keys = require('./keys.js');
const invites = require('./invite.js');
const users = require('./users.js');

module.exports = function (app) {
    app.use('/', index);
    app.use('/home', home);
    app.use('/v', view);
    app.use('/api/upload', upload);
    app.use('/api/auth', auth);
    app.use('/api/keys', keys);
    app.use('/api/invites', invites);
    app.use('/api/users', users);
    app.use('/register', register);
    app.use('/login', login);
    app.use('/panel', panel);
    app.use('/panel*', panel);
};