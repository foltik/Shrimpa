const express = require('express');
const router = express.Router();

const ModelPath = '../../models/';
const Upload = require(ModelPath + 'Upload.js');
const View = require(ModelPath + 'View.js');

const wrap = require('../../util/wrap');
const bodyVerifier = require('../../util/verifyBody').bodyVerifier;
const requireAuth = require('../../util/auth').requireAuth;

const uploadProps = [
    {name: 'after', type: 'date', optional: true},
    {name: 'before', type: 'date', optional: true},
    {name: 'limit', type: 'number', min: 1, max: 10000, optional: true}
];

router.get('/uploads', requireAuth('stats.get'), bodyVerifier(uploadProps), wrap(async (req, res) => {
    let constraints = {uploader: req.username};

    // Set date constraints if specified
    if (req.body.after || req.body.before)
        constraints.date = {};
    if (req.body.after)
        constraints.date.$gt = new Date(req.body.after);
    if (req.body.before)
        constraints.date.$lt = new Date(req.body.before);

    // Create query
    const query = Upload.find(constraints);

    // Limit if specified
    if (req.body.limit)
        query.limit(req.body.limit);

    // Fetch and transform results
    let uploads = await query;
    uploads = uploads.map(upload => {
        return {
            date: upload.date,
            uid: upload.uid,
            key: upload.uploaderKey,
            originalName: upload.file.originalName,
            size: upload.file.size,
            mime: upload.file.mime
        }
    });

    res.status(200).json(uploads);
}));


const viewProps = [
    {name: 'after', type: 'date', optional: true},
    {name: 'before', type: 'date', optional: true},
    {name: 'limit', type: 'number', min: 1, max: 10000, optional: true}
];

router.get('/views', requireAuth('stats.get'), bodyVerifier(viewProps), wrap(async (req, res) => {
    let constraints = {uploader: req.username};

    // Set date constraints if specified
    if (req.body.after || req.body.before)
        constraints.date = {};
    if (req.body.after)
        constraints.date.$gt = new Date(req.body.after);
    if (req.body.before)
        constraints.date.$lt = new Date(req.body.before);

    // Create query
    const query = View.find(constraints);

    // Limit if specified
    if (req.body.limit)
        query.limit(req.body.limit);

    // Fetch and transform results
    let views = await query;
    views = views.map(view => {
        return {
            date: view.date,
            uid: view.uid,
        }
    });

    res.status(200).json(views);
}));

module.exports = router;