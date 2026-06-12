const scoreService = require('../services/scoreService');
const dailyChallengeService = require('../services/dailyChallengeService');

/**
 * @desc    Submit a quiz score and calculate XP
 * @route   POST /api/scores
 * @access  Private
 */
exports.submitScore = async (req, res, next) => {
  try {
    const { correctAnswers, difficulty, timeLeft, timeLimit, categoryId, isDailyChallenge } = req.validated.body;

    let bonusXP = 0;

    if (isDailyChallenge) {
      const todayUTC = new Date().toISOString().slice(0, 10);
      if (req.user.lastDailyChallengeDate === todayUTC) {
        const error = new Error("You have already completed today's daily challenge");
        error.statusCode = 409;
        return next(error);
      }
      bonusXP = await dailyChallengeService.getTodayBonusXP();
    }

    const result = await scoreService.submitScore(
      req.user._id,
      correctAnswers,
      difficulty,
      timeLeft,
      timeLimit,
      categoryId,
      bonusXP
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Score submitted and XP updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
