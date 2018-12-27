const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const sanitizer = require('express-sanitizer');
const helmet = require('helmet');

const app = express();
const config = require('config');

// MongoDB
const dbHost = config.get('Database.host');
let db;
mongoose.connect(dbHost, {useNewUrlParser: true})
    .then(() => {
        console.log('Connected to database ' + dbHost + '\n');
        db = mongoose.connection;
    });

const MongoStore = require('connect-mongo')(session);
const mongoStore = new MongoStore({url: dbHost});

// HTTP Request Logging
if (config.get('Log.http'))
    app.use(morgan(config.get('Log.httpLevel')));

// Session setup
app.use(helmet());
app.set('trust proxy', 1);
app.use(session({
    secret: 'secret',
    name: 'session.id',
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
        //secure: true,
        httpOnly: true,
        //domain: 'shimapan.rocks',
        maxAge: 1000 * 60 * 60
    }
}));

// Middleware
app.use(passport.initialize(null));
app.use(passport.session(null));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(sanitizer());
app.use(methodOverride('X-HTTP-Method-Override'));

// Static directories and favicon
//app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.static(__dirname + '/public'));

// Install routes and configure authentication strategy
require('./app/routes/routes.js')(app);
require('./config/passport.js');

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({'message': 'Internal server error.'});
});

app.set('trust proxy', config.get('Server.trustProxy'));

// Start app
const port = config.get('Server.port');

let server;
if (config.get('Server.tls')) {
    const options = {
        cert: fs.readFileSync('./cert.pem'),
        key: fs.readFileSync('./privkey.pem'),
    };
    server = https.createServer(options, app).listen(port, () =>
        console.log(`Listening on port ${port}...`));
} else {
    server = app.listen(port, () =>
        console.log(`Listening on port ${port}...`));
}

// Expose app
module.exports.app = app;
module.exports.server = server;
