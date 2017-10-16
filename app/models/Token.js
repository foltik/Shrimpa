var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var jwtsign = require('jwt-sign');

var TokenSchema = mongoose.Schema({
    scope: [String],
    issuer: String,
    issued: Date,
    exp: Date
});

TokenSchema.methods.genJwt = function(expiry) {
    var exp = new Date();
    exp.setDate(exp.getDate() + expiry);

    var payload = {
        _id: this._id,
        username: this.username,
        scope: this.scope,
        exp: parseInt(exp.getTime() / 1000)
    };

    var key = fs.readFilySync(path.join(__dirname, '../../jwt.pem'), 'utf8');

    return jwt.sign(payload, key);
};

module.exports = mongoose.model('Token', TokenSchema);