var mongoose = require('mongoose');

var InviteSchema = mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },

    scope: {
        type: [String],
        required: true
    },

    issuer: {
        type: String,
        required: true
    },

    recipient: {
        type: String,
        default: null
    },

    issued: {
        type: Date,
        default: Date.now
    },

    used: {
        type: Date,
        default: null
    },

    exp: {
        type: Date,
        default: null
    }
});

/*InviteSchema.methods.use = function(canonicalname, cb) {
    return this.model('Invite').updateOne({code: this.code}, {recipient: canonicalname, used: Date.now()}, cb);
};*/

module.exports = mongoose.model('Invite', InviteSchema);