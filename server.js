var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var morgan = require('morgan');
var passport = require('passport');
var session = require('express-session');
var sanitizer = require('express-sanitizer');
var helmet = require('helmet');

var app = express();

var config = require('config');
if(config.util.getEnv('NODE_ENV') !== 'test') {
    app.use(morgan('combined'));
}

mongoose.Promise = global.Promise;
mongoose.connect(config.dbHost, {useMongoClient: true});
var db = mongoose.connection;
db.on('error', function(err) {
    if (err) console.log('MongoDB Connection Error: ', err);
});
var MongoStore = require('connect-mongo')(session);
var mongoStore = new MongoStore({
    url: config.dbHost
});


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
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(sanitizer());
app.use(methodOverride('X-HTTP-Method-Override'));


//app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.static(__dirname + '/public'));


require('./app/routes/routes.js')(app);
require('./config/passport.js');


// Start app
var port = process.env.PORT || 8080;
var server = app.listen(port);
console.log('Listening on port ', port, '...');

// Expose app
exports.db = db;
exports.server = server;
exports.app = app;
