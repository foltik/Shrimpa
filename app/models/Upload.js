var mongoose = require('mongoose');

var UploadSchema = mongoose.Schema({
    uid: {
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
    
    file: {
        type: Object,
        required: true
    }
});

module.exports = mongoose.model('Upload', UploadSchema);