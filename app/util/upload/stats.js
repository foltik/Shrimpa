const ModelPath = '../../models/';
const User = require(ModelPath + 'User.js');
const Key = require(ModelPath + 'Key.js');

const updateStats = req =>
    Promise.all([
        User.updateOne({username: req.username}, {$inc: {uploadCount: 1, uploadSize: req.file.size}}),
        req.key
            ? Key.updateOne({key: req.key}, {$inc: {uploadCount: 1, uploadSize: req.file.size}})
            : Promise.resolve()
    ]);

module.exports = updateStats;