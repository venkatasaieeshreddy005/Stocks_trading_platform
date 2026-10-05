const express = require('express');
const { requireAuth } = require('../middleware/auth');
const watchlistController = require('../controllers/watchlistController');

const router = express.Router();

router.get('/', requireAuth, watchlistController.getWatchlist);
router.post('/toggle', requireAuth, watchlistController.toggleWatchlist);
router.get('/alerts', requireAuth, watchlistController.getAlerts);
router.delete('/alerts/:id', requireAuth, watchlistController.dismissAlert);
router.delete('/alerts', requireAuth, watchlistController.clearAlerts);

module.exports = router;
