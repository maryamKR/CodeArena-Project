const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const validate = require('../middlewares/validate');
const { leaderboardSchema } = require('../validators/leaderboardValidator');

// User: Get Leaderboard
router.get('/', validate(leaderboardSchema), getLeaderboard);

module.exports = router;
