const Busboy = require('busboy');
const is = require('type-is');
const config = require('config');

const wrap = require('../wrap');
const auth = require('../auth');
const disk = require('./disk');
const identifier = require('./id');

const uploadMultipart = wrap(async (req, res, next) => {
    if (!is(req, ['multipart']))
        return res.status(400).json({message: 'Bad request.'});

    // Store whether the user has authenticated, because an api key might be included with the form later
    let authStatus = {
        authenticated: false,
        permission: false
    };
    // If not authenticated with a session, we'll have to wait for key authentication from the multipart form data
    await auth.checkSession(req, 'file.upload', authStatus);

    // Function to call once the file is sent or an error is encountered
    let isDone = false;
    const done = async (err, data) => {
        if (isDone) return;
        isDone = true;

        req.unpipe(busboy);
        busboy.removeAllListeners();
        req.on('readable', req.read.bind(req));

        if (err) {
            if (data.path)
                await disk.remove(data.path);

            if (err === 'LIMIT_FILE_SIZE')
                return res.status(413).json({message: 'File too large.'});
            else {
                console.log(err.stack);
                return res.status(500).json({message: 'Internal server error.'});
            }
        } else {
            req.file = data.file;
            next();
        }
    };

    // Create the busboy object to parse the multipart data
    const busboy = new Busboy({
        headers: req.headers,
        limits: {
            fileSize: config.get('Upload.maxSize')
        }
    });

    req.body = {};
    busboy.on('field', (fieldName, value) => {
        req.body[fieldName] = value;
    });

    let fileReceived = false;
    busboy.on('file', async (fieldName, stream, name, encoding, mime) => {
        // Only process one file, discard everything after that
        if (fileReceived)
            return req.unpipe(busboy);
        fileReceived = true;

        // If a key was encountered and we are not authenticated, try to authenticate with it before the final check
        if (req.body.key && !authStatus.authenticated)
            await auth.checkKey(req, 'file.upload', authStatus);

        // Finally, check if we have auth before preceeding, keys should have been processed by now
        if (!authStatus.authenticated)
            return res.status(401).json({message: 'Unauthorized.'});
        if (!authStatus.permission)
            return res.status(403).json({message: 'Forbidden.'});

        // Don't attach to the files object if there is no file
        if (!name) return stream.resume();

        // Generate an ID for the file, saving it with that filename
        const path = config.get('Upload.path');
        const newName = await identifier.generate();
        const finalPath = path + '/' + newName;

        // Set the file attributes
        file = {
            originalName: name,
            name: newName,
            path: finalPath,
            encoding: encoding,
            mime: mime
        };

        // Ensure the output directory exists
        await disk.mkdir(path);

        // Handle errors
        stream.on('error', err => done(err, {path: finalPath}));
        stream.on('limit', () => done('LIMIT_FILE_SIZE', {path: finalPath}));

        file.size = await disk.write(finalPath, stream);

        await done(null, {file: file});
    });

    busboy.on('error', err => done(err));
    busboy.on('finished', () => done(null, {file: file}));

    req.pipe(busboy);
});

module.exports = uploadMultipart;