const fs = require('fs');
const fsPromises = fs.promises;

const mkdir = path => new Promise((resolve, reject) => {
    fsPromises.mkdir(path)
        .then(resolve)
        .catch(err => {
            if (err.code === 'EEXIST')
                resolve();
            else
                reject(err);
        });
});

const write = (path, stream) => new Promise((resolve, reject) => {
    const outStream = fs.createWriteStream(path);
    stream.pipe(outStream);
    outStream.on('error', reject);
    outStream.on('close', () => resolve(outStream.bytesWritten));
    outStream.on('finish', () => resolve(outStream.bytesWritten));
});

const remove = path =>
    fsPromises.unlink(path);

exports.mkdir = mkdir;
exports.write = write;
exports.remove = remove;