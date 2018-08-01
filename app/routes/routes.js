// Views
const index = require('./index.js');
const home = require('./home.js');
const register = require('./register.js');
const login = require('./login.js');
const panel = require('./panel.js');

// API
const auth = require('./api/auth.js');
const upload = require('./api/upload.js');
const view = require('./api/view.js');
const invites = require('./api/invites.js');
const keys = require('./api/keys.js');
const users = require('./api/users.js');

module.exports = function (app) {
    app.use('/', index);
    app.use('/home', home);
    app.use('/register', register);
    app.use('/login', login);
    app.use('/panel', panel);
    app.use('/panel*', panel);


    app.use('/api/auth', auth);
    app.use('/api/upload', upload);
    app.use('/v', view);
    app.use('/api/view', view);
    app.use('/api/invites', invites);
    app.use('/api/keys', keys);
    app.use('/api/users', users);
};