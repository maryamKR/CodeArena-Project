const scoreService = require('../services/scoreService');
const dailyChallengeService = require('../services/dailyChallengeService');
const Question = require('../models/Question');

/**
 * @desc    Submit a quiz score and calculate XP
 * @route   POST /api/scores
 * @access  Private
 */
exports.submitScore = async (req, res, next) => {
  try {
    const { answers, difficulty, timeLeft, timeLimit, categoryId, isDailyChallenge } = req.validated.body;

    // Fetch the correct answers from the database for the submitted questions
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let correctAnswers = 0;
    for (const submission of answers) {
      const dbQuestion = questions.find(q => q._id.toString() === submission.questionId);
      if (dbQuestion && dbQuestion.correct_answer === submission.selectedAnswer) {
        correctAnswers++;
      }
    }

    let bonusXP = 0;

    if (isDailyChallenge) {
      const todayUTC = new Date().toISOString().slice(0, 10);
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
