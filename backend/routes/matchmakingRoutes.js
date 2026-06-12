const express = require('express');
const router = express.Router();
const { joinQueue, leaveQueue, getQueueStatus } = require('../controllers/matchmakingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Player: Join the matchmaking queue
router.post('/join', protect, joinQueue);

// Player: Leave the matchmaking queue
router.delete('/leave', protect, leaveQueue);

// Admin: Inspect the live queue
router.get('/status', protect, authorize('admin'), getQueueStatus);

module.exports = router;
