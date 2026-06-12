const scoreService = require('../services/scoreService');

/**
 * @desc    Submit a quiz score and calculate XP
 * @route   POST /api/scores
 * @access  Private
 */
exports.submitScore = async (req, res, next) => {
  try {
    const { correctAnswers, difficulty, timeLeft, timeLimit, categoryId } = req.validated.body;

    const result = await scoreService.submitScore(
      req.user._id,
      correctAnswers,
      difficulty,
      timeLeft,
      timeLimit,
      categoryId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Score submitted and XP updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
