var mongoose = require('mongoose');

var UploadSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    oname: String,
    date: Date,
    file: Object
});

module.exports = mongoose.model('Upload', UploadSchema);