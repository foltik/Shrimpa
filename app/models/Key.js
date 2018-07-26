const mongoose = require('mongoose');

const KeySchema = mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true
    },

    identifier: {
        type: String,
        required: true
    },

    scope: {
        type: [String],
        required: true,
    },

    uploadCount: {
        type: Number,
        default: 0
    },

    uploadSize: {
        type: Number,
        default: 0
    },

    issuer: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Key', KeySchema);