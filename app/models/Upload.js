var mongoose = require('mongoose');

var UploadSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    uploader: String,
    date: Date,
    file: Object
});

module.exports = mongoose.model('Upload', UploadSchema);