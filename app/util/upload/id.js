const config = require('config');

const ModelPath = '../../models/';
const Upload = require(ModelPath + 'Upload.js');

const exists = async id =>
    await Upload.countDocuments({id: id}) === 1;

const generate = async () => {
    const charset = config.get('Upload.charset');
    const len = config.get('Upload.idLength');

    const id = [...Array(len)]
        .map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
        .join('');

    return await exists(id)
        ? generate()
        : id;
};

exports.generate = generate;
exports.exists = exists;