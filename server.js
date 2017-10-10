var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');

var app = express();

mongoose.connect('mongodb://localhost/shimapan', {useMongoClient: true});
var db = mongoose.connection;

db.on('error', function(err) {
    if (err)
        console.log('MongoDB Connection Error: ', err);
    else
        console.log('MongoDB Connection Established');

});

db.once('open', function() {
    console.log('MongoDB Connection Open')
});

app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('X-HTTP-Method-Override'));

// Set /public to document root
app.use(express.static(__dirname + '/public'));
require('./app/routes')(app);

// Start app
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Listening on port ', port, '...');

// Expose app
exports = module.exports = app;