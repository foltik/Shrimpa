var mongoose = require('mongoose');

var InviteSchema = mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },
    level: Number,
    issuer: String,
    recipient: String,
    issued: Date,
    used: Date,
    exp: Date
});

module.exports = mongoose.model('Invite', InviteSchema);