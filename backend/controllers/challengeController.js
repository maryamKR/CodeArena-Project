const challengeService = require('../services/challengeService');

/**
 * @desc    Send a challenge to another user
 * @route   POST /api/challenges
 * @access  Private
 */
exports.sendChallenge = async (req, res, next) => {
  try {
    const { receiverUsername, category, difficulty, message } = req.validated.body;

    const { challenge, receiverUsername: resolvedReceiverName } = await challengeService.sendChallenge(
      req.user._id,
      req.user.username,
      receiverUsername,
      category,
      difficulty,
      message
    );

    res.status(201).json({
      success: true,
      data: challenge,
      message: `Challenge sent to ${resolvedReceiverName}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a pending challenge
 * @route   PUT /api/challenges/:id/accept
 * @access  Private
 */
exports.acceptChallenge = async (req, res, next) => {
  try {
    const { id } = req.validated.params;

    const challenge = await challengeService.acceptChallenge(id, req.user._id);

    res.status(200).json({
      success: true,
      data: challenge,
      message: 'Challenge accepted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Decline a pending challenge
 * @route   PUT /api/challenges/:id/decline
 * @access  Private
 */
exports.declineChallenge = async (req, res, next) => {
  try {
    const { id } = req.validated.params;

    const challenge = await challengeService.declineChallenge(id, req.user._id);

    res.status(200).json({
      success: true,
      data: challenge,
      message: 'Challenge declined',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending challenges for the authenticated user
 * @route   GET /api/challenges/pending
 * @access  Private
 */
exports.getPendingChallenges = async (req, res, next) => {
  try {
    const challenges = await challengeService.getPendingChallenges(req.user._id);

    res.status(200).json({
      success: true,
      count: challenges.length,
      data: challenges,
    });
  } catch (error) {
    next(error);
  }
};
