const express = require('express');
const marketController = require('../controllers/marketController');

const router = express.Router();

router.get('/instruments', marketController.getInstruments);
router.get('/instruments/:symbol', marketController.getInstrumentDetail);
router.get('/movers', marketController.getMovers);
router.get('/sentiment', marketController.getSentiment);
router.get('/sectors', marketController.getSectors);

module.exports = router;
