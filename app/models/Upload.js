var mongoose = require('mongoose');

var UploadSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    id: {
        type: String,
        unique: true,
        required: true
    },

    views: {
        type: Number,
        default: 0
    },

    uploader: {
        type: String,
        required: true
    },

    uploaderKey: {
        type: String,
        default: null
    },

    date: {
        type: Date,
        default: Date.now
    },

    mime: {
        type: String,
        required: true,
    },

    file: {
        type: Object,
        required: true
    }
});

module.exports = mongoose.model('Upload', UploadSchema);