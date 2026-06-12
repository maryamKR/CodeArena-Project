const express = require('express');
const router = express.Router();

const {
  sendChallenge,
  acceptChallenge,
  declineChallenge,
  getPendingChallenges,
} = require('../controllers/challengeController');

const { protect } = require('../middlewares/authMiddleware');
const { challengeLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { sendChallengeSchema, challengeIdSchema } = require('../validators/challengeValidator');

// User: Send a challenge to another user
router.post('/', protect, challengeLimiter, validate(sendChallengeSchema), sendChallenge);

// User: Accept a pending challenge (receiver only)
router.put('/:id/accept', protect, validate(challengeIdSchema), acceptChallenge);

// User: Decline a pending challenge (receiver only)
router.put('/:id/decline', protect, validate(challengeIdSchema), declineChallenge);

// User: Get all pending challenges sent to the authenticated user
router.get('/pending', protect, getPendingChallenges);

module.exports = router;
