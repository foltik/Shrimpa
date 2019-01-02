const express = require('express');
const router = express.Router();
const path = require('path');
const authenticate = require('../util/auth/authenticateRequest');

router.get('/', authenticate(), function(req, res) {
    res.sendFile(path.join(__dirname, '../../public/views', 'home.html'));
});

module.exports = router;