const express = require('express');
const router = express.Router();
const { getHallOfFame } = require('../controllers/leaderboardController');
const validate = require('../middlewares/validate');
const { hallOfFameSchema } = require('../validators/leaderboardValidator');

// User: Get Hall of Fame
router.get('/', validate(hallOfFameSchema), getHallOfFame);

module.exports = router;
