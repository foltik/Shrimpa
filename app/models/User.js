var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = mongoose.Schema({
    username: {
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

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);