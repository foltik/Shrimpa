var mongoose = require('mongoose');

var InviteSchema = mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },
    scope: [String],
    issuer: String,
    recipient: String,
    issued: Date,
    used: Date,
    exp: Date
});

InviteSchema.methods.use = function(canonicalname, cb) {
    return this.model('Invite').updateOne({code: this.code}, {recipient: canonicalname, used: Date.now()}, cb);
};

module.exports = mongoose.model('Invite', InviteSchema);