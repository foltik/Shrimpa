var mongoose = require('mongoose');

var KeySchema = mongoose.Schema({
    key: String,
    identifier: {
        type: String,
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
    username: String,
    date: Date
});

module.exports = mongoose.model('Key', KeySchema);