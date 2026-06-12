const express = require('express');
const router = express.Router();
const { getLeaderboard, getMyRank } = require('../controllers/leaderboardController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { leaderboardSchema } = require('../validators/leaderboardValidator');

// User: Get own global rank (must be BEFORE the /:param routes to avoid conflicts)
router.get('/me', protect, getMyRank);

// Protected: Get Leaderboard
router.get('/', protect, validate(leaderboardSchema), getLeaderboard);

module.exports = router;
