var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    canonicalname: {
        type: String,
        unique: true,
        required: true
    },
    scope: [String],
    uploadCount: {
        type: Number,
        default: 0
    },
    uploadSize: {
        type: Number,
        default: 0
    },
    date: Date
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'canonicalname',
    saltlen: 32,
    iterations: 10000,
    limitAttempts: true
});

module.exports = mongoose.model('User', UserSchema);