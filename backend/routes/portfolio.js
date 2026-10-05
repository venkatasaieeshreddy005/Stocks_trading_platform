const express = require('express');
const { requireAuth } = require('../middleware/auth');
const portfolioController = require('../controllers/portfolioController');

const router = express.Router();

router.get('/', requireAuth, portfolioController.getPortfolio);

module.exports = router;
