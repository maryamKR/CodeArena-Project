const express = require('express');
const router = express.Router();

const { getTodayChallenge, setTodayChallenge } = require('../controllers/dailyChallengeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { setDailyChallengeSchema } = require('../validators/dailyChallengeValidator');

// Auth required — only logged-in users can view and play the daily challenge
router.get('/', protect, getTodayChallenge);

// Admin only — set or update the daily challenge
router.post('/', protect, authorize('admin'), validate(setDailyChallengeSchema), setTodayChallenge);

module.exports = router;
