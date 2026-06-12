const scoreService = require('../services/scoreService');
const DailyChallenge = require('../models/DailyChallenge');

/** Returns today's UTC date as a YYYY-MM-DD string */
const todayUTC = () => new Date().toISOString().slice(0, 10);

/**
 * @desc    Submit a quiz score and calculate XP.
 *          Pass isDailyChallenge: true to also claim today's bonus XP.
 * @route   POST /api/scores
 * @access  Private
 */
exports.submitScore = async (req, res, next) => {
  try {
    const { correctAnswers, difficulty, timeLeft, timeLimit, categoryId, isDailyChallenge } = req.validated.body;

    let bonusXP = 0;

    if (isDailyChallenge) {
      // 1. Fetch today's challenge
      const challenge = await DailyChallenge.findOne({ activeDate: todayUTC() });
      if (!challenge) {
        const error = new Error('No daily challenge has been set for today');
        error.statusCode = 404;
        return next(error);
      }

      // 2. Guard: user may only complete the daily challenge once per UTC day
      const alreadyCompleted = req.user.lastDailyChallengeDate === todayUTC();
      if (alreadyCompleted) {
        const error = new Error('You have already completed today\'s daily challenge');
        error.statusCode = 409;
        return next(error);
      }

      bonusXP = challenge.bonusXP;
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
