const User = require('../models/User');

const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const BASE_XP_PER_ANSWER = 10;

const RANK_THRESHOLDS = [
  { minXP: 5000, rank: 'Expert' },
  { minXP: 2000, rank: 'Advanced' },
  { minXP: 500,  rank: 'Intermediate' },
];

class ScoreService {
  /**
   * Calculates XP based on quiz performance and updates the user's totalXP.
   * Formula: correctAnswers * baseXP * difficultyMultiplier * speedBonus
   *
   * @param {string} userId - ID of the user
   * @param {number} correctAnswers - Number of correctly answered questions
   * @param {string} difficulty - Difficulty of the quiz ('Easy', 'Medium', 'Hard')
   * @param {number} timeLeft - Remaining time when finished (in seconds)
   * @param {number} timeLimit - Total time given for the quiz (in seconds)
   * @returns {Promise<Object>} Object containing calculated XP and new user state
   */
  async submitScore(userId, correctAnswers, difficulty, timeLeft, timeLimit) {
    // 1. Determine Difficulty Multiplier
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty?.toLowerCase()] || 1;

    // 2. Determine Speed Bonus: 1 + (timeLeft / timeLimit). Default to 1 if no time info.
    let speedBonus = 1;
    if (timeLeft !== undefined && timeLimit !== undefined && timeLimit > 0 && timeLeft >= 0) {
      speedBonus = 1 + (timeLeft / timeLimit);
    }

    // 3. Calculate XP
    const calculatedXP = Math.round(
      correctAnswers * BASE_XP_PER_ANSWER * difficultyMultiplier * speedBonus
    );

    // 4. Update User
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.totalXP += calculatedXP;

    // 5. Rank progression (Beginner -> Intermediate -> Advanced -> Expert)
    for (const { minXP, rank } of RANK_THRESHOLDS) {
      if (user.totalXP >= minXP) {
        user.rank = rank;
        break;
      }
    }

    await user.save();

    return {
      earnedXP: calculatedXP,
      totalXP: user.totalXP,
      rank: user.rank,
      breakdown: {
        correctAnswers,
        baseXPPerAnswer: BASE_XP_PER_ANSWER,
        difficultyMultiplier,
        speedBonus: parseFloat(speedBonus.toFixed(2)),
      },
    };
  }
}

module.exports = new ScoreService();
