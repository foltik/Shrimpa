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
    const arr = res1;
    arr.concat(res2);

    let res = {};

    for (let obj of arr) {
        if (res[obj._id])
            mergeAggregateStats(res[obj._id], obj);
        else
            res[obj._id] = filterAggregateStats(obj);
    }

    return res;
}

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
    const stats = await (Upload.collection.aggregate([
        {
            $match: {
                'uploader': req.username
            }
        },
        {
            $project: {
                'views': '$views',
                'size': '$file.size'
            }
        },
        {
            $group: {
                '_id': 'total',
                'count': {$sum: 1},
                'views': {$sum: '$views'},
                'size': {$sum: '$size'}
            }
        }
    ]).toArray());

    res.status(200).json(stats);
}));

module.exports = router;