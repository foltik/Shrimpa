var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },

    displayname: {
        type: String,
        unique: true,
        required: true
    },

    scope: {
        type: [String],
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

    date: {
        type: Date,
        default: Date.now
    }
});

UserSchema.plugin(passportLocalMongoose, {
    saltlen: 64,
    iterations: 10000,
    limitAttempts: true
});

module.exports = mongoose.model('User', UserSchema);