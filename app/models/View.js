const mongoose = require('mongoose');

const ViewSchema = mongoose.Schema({
    uid: {
        type: String,
        unique: true,
        required: true
    },

    uploader: {
        type: String,
        required: true
    },

    remoteAddress: {
        type: String,
        required: true
    },

    userAgent: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('View', ViewSchema);