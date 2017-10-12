var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var morgan = require('morgan');
var passport = require('passport');

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

require('./config/passport.js');

app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(passport.initialize());

// Set /public to document root
app.use(express.static(__dirname + '/public'));
require('./app/routes')(app);

// Start app
var port = process.env.PORT || 8080;
var server = app.listen(port);
console.log('Listening on port ', port, '...');

// Expose app
exports.db = db;
exports.server = server;
exports.app = app;
