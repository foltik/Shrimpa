const express = require('express');
const router = express.Router();
const path = require('path');
const requireAuth = require('../util/auth').requireAuth;

router.get('/', requireAuth(), function(req, res) {
    res.sendFile(path.join(__dirname, '../../public/views', 'home.html'));
});

module.exports = router;