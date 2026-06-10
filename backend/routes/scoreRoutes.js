const express = require('express');
const router = express.Router();
const { submitScore } = require('../controllers/scoreController');
const { protect } = require('../middlewares/authMiddleware');
const { scoreLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { scoreSchema } = require('../validators/scoreValidator');

// User: Submit quiz score and get XP
router.post('/', protect, scoreLimiter, validate(scoreSchema), submitScore);

module.exports = router;
