var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var jwtsign = require('jwt-sign');

var UserSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    uploadCount: {
        type: Number,
        default: 0
    },
    uploadSize: {
        type: Number,
        default: 0
    },
    scope: [String],
    hash: String,
    salt: String,
    date: Date
});

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha256').toString('hex');
};

UserSchema.methods.validatePassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha256').toString('hex');
    return this.hash === hash;
};

UserSchema.methods.genJwt = function() {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    var payload = {
        _id: this._id,
        username: this.username,
        scope: this.scope,
        exp: parseInt(expiry.getTime() / 1000)
    };

    var key = fs.readFileSync(path.join(__dirname, '../../jwt.pem'), 'utf8');

    return jwt.sign(payload, key);
};

module.exports = mongoose.model('User', UserSchema);