const User = require('../models/User');
const History = require('../models/History');
const { RANK_THRESHOLDS } = require('../utils/constants');

const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const BASE_XP_PER_ANSWER = 10;

class ScoreService {
  /**
   * Calculates XP based on quiz performance and updates the user's totalXP.
   * Formula: correctAnswers * baseXP * difficultyMultiplier * speedBonus [+ bonusXP]
   *
   * @param {string} userId       - ID of the user
   * @param {number} correctAnswers - Number of correctly answered questions
   * @param {string} difficulty   - Difficulty of the quiz ('Easy', 'Medium', 'Hard')
   * @param {number} timeLeft     - Remaining time when finished (in seconds)
   * @param {number} timeLimit    - Total time given for the quiz (in seconds)
   * @param {string} categoryId   - Optional ID of the category
   * @param {number} bonusXP      - Optional flat bonus from the daily challenge
   * @returns {Promise<Object>} Object containing calculated XP and new user state
   */
  async submitScore(userId, correctAnswers, difficulty, timeLeft, timeLimit, categoryId, bonusXP = 0) {
    // 1. Determine Difficulty Multiplier
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty?.toLowerCase()] || 1;

    // 2. Determine Speed Bonus: 1 + (timeLeft / timeLimit). Default to 1 if no time info.
    let speedBonus = 1;
    if (timeLeft !== undefined && timeLimit !== undefined && timeLimit > 0 && timeLeft >= 0) {
      speedBonus = 1 + (timeLeft / timeLimit);
    }

    // 3. Calculate XP (base quiz XP + optional daily challenge bonus)
    const baseXP = Math.round(
      correctAnswers * BASE_XP_PER_ANSWER * difficultyMultiplier * speedBonus
    );
    const calculatedXP = baseXP + (bonusXP > 0 ? bonusXP : 0);

    // 4. Atomically increment totalXP, quizzesPlayed, and categoryXP to prevent race conditions.
    //    If a bonus was applied, also stamp lastDailyChallengeDate (today UTC) to block replays.
    const todayUTC = new Date().toISOString().slice(0, 10);
    const updateQuery = { $inc: { totalXP: calculatedXP, quizzesPlayed: 1 } };
    if (categoryId) {
      updateQuery.$inc[`categoryXP.${categoryId}`] = calculatedXP;
    }
    if (bonusXP > 0) {
      updateQuery.$set = { lastDailyChallengeDate: todayUTC };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateQuery,
      { returnDocument: 'after' }
    );
    if (!user) {
      throw new Error('User not found');
    }

    // 5. Rank progression (Beginner -> Intermediate -> Advanced -> Master)
    // Evaluated against the post-increment value; idempotent if concurrent
    let newRank = 'Beginner';
    for (const { minXP, rank } of RANK_THRESHOLDS) {
      if (user.totalXP >= minXP) {
        newRank = rank;
        break;
      }
    }
    if (user.rank !== newRank) {
      user.rank = newRank;
      await user.save();
    }

    // 6. Record the history attempt
    const historyData = {
      user: userId,
      correctAnswers,
      difficulty: difficulty || 'Easy',
      earnedXP: calculatedXP,
      timeLeft: timeLeft || 0,
      timeLimit: timeLimit || 0,
    };
    if (categoryId) {
      historyData.category = categoryId;
    }
    await History.create(historyData);

    const result = {
      earnedXP: calculatedXP,
      totalXP: user.totalXP,
      quizzesPlayed: user.quizzesPlayed,
      rank: user.rank,
      breakdown: {
        correctAnswers,
        baseXPPerAnswer: BASE_XP_PER_ANSWER,
        difficultyMultiplier,
        speedBonus: parseFloat(speedBonus.toFixed(2)),
      },
    };
    if (bonusXP > 0) {
      result.bonusXP = bonusXP;
    }
    return result;
  }
}

module.exports = new ScoreService();
