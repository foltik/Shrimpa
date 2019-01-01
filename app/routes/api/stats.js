const express = require('express');
const router = express.Router();

const ModelPath = '../../models/';
const Upload = require(ModelPath + 'Upload.js');
const View = require(ModelPath + 'View.js');

const wrap = require('../../util/wrap');
const bodyVerifier = require('../../util/verifyBody').bodyVerifier;
const requireAuth = require('../../util/auth').requireAuth;

const oneDay = 1000 * 60 * 60 * 24;

function filterAggregateStats(obj) {
    if (obj._id)
        delete obj._id;

    return obj;
}

function mergeAggregateStats(obj1, obj2) {
    filterAggregateStats(obj1);
    filterAggregateStats(obj2);

    let res = {};
    Object.assign(res, obj1, obj2);
    return res;
}

function mergeAggregations(res1, res2) {
    const arr = res1.concat(res2);

    let res = {};

    for (let obj of arr) {
        if (res[obj._id])
            res[obj._id] = mergeAggregateStats(res[obj._id], obj);
        else
            res[obj._id] = filterAggregateStats(obj);
    }

    return res;
}


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
            file: {
                originalName: upload.file.originalName,
                size: upload.file.size,
                mime: upload.file.mime
            }
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

router.get('/week', requireAuth('stats.get'), wrap(async (req, res) => {
    const currentDate = new Date();

    const uploadStats = await (Upload.collection.aggregate([
        {
            $match: {
                'date': {$gt: new Date(currentDate - 7 * oneDay)},
                'uploader': req.username
            }
        },
        {
            $project: {
                'date': {
                    $concat: [
                        {$substr: ['$date', 5, 2]},
                        '-',
                        {$substr: ['$date', 8, 2]}
                    ]
                },
                'size': '$file.size'
            }
        },
        {
            $group: {
                '_id': '$date',
                'uploads': {$sum: 1},
                'size': {$sum: '$size'}
            }
        }
    ]).toArray());
    const viewStats = await (View.collection.aggregate([
        {
            $match: {
                'date': {$gt: new Date(currentDate - 7 * oneDay)},
                'uploader': req.username
            }
        },
        {
            $project: {
                'date': {
                    $concat: [
                        {$substr: ['$date', 5, 2]},
                        '-',
                        {$substr: ['$date', 8, 2]}
                    ]
                }
            }
        },
        {
            $group: {
                '_id': '$date',
                'views': {$sum: 1},
            }
        }
    ]).toArray());

    const stats = mergeAggregations(uploadStats, viewStats);

    res.status(200).json(stats);
}));

router.get('/all', requireAuth('stats.get'), wrap(async (req, res) => {
    const uploadStats = await (Upload.collection.aggregate([
        {
            $match: {
                'uploader': req.username
            }
        },
        {
            $project: {
                'size': '$file.size'
            }
        },
        {
            $group: {
                '_id': 'total',
                'count': {$sum: 1},
                'size': {$sum: '$size'}
            }
        }
    ]).toArray());
    const viewStats = await (View.collection.aggregate([
        {
            $match: {
                'uploader': req.username
            }
        },
        {
            $group: {
                '_id': 'total',
                'views': {$sum: 1},
            }
        }
    ]).toArray());

    const stats = mergeAggregations(uploadStats, viewStats);

    res.status(200).json(stats);
}));

module.exports = router;