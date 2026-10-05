const express = require('express');
const { requireAuth } = require('../middleware/auth');
const fundController = require('../controllers/fundController');

const router = express.Router();

router.post('/add', requireAuth, fundController.addFunds);

module.exports = router;
