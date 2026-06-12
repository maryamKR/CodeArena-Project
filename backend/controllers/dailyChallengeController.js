const dailyChallengeService = require('../services/dailyChallengeService');

/**
 * @desc    Get today's active daily challenge
 * @route   GET /api/daily-challenge
 * @access  Private
 */
exports.getTodayChallenge = async (req, res, next) => {
  try {
    const data = await dailyChallengeService.getToday();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set (or update) the daily challenge for a given date
 * @route   POST /api/daily-challenge
 * @access  Private — Admin
 */
exports.setTodayChallenge = async (req, res, next) => {
  try {
    const { categoryId, difficulty, bonusXP, activeDate } = req.validated.body;

    const data = await dailyChallengeService.setChallenge(
      categoryId,
      difficulty,
      bonusXP,
      activeDate ?? null,
      req.user._id
    );

    res.status(201).json({
      success: true,
      data,
      message: 'Daily challenge set successfully',
    });
  } catch (error) {
    next(error);
  }
};
