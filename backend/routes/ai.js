const express = require('express');
const { requireAuth } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', requireAuth, aiController.chat);
router.post('/analyze-stock', requireAuth, aiController.analyzeStock);

module.exports = router;