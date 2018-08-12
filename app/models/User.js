const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const config = require('config');

const UserSchema = mongoose.Schema({
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
    },

    banned: {
        type: Boolean,
        default: false,
        expires: {
            type: Date,
            default: null
        }
    }
});

UserSchema.plugin(passportLocalMongoose, {
    saltlen: config.get('User.Password.saltLength'),
    iterations: config.get('User.Password.hashIterations'),
    limitAttempts: true
});

module.exports = mongoose.model('User', UserSchema);