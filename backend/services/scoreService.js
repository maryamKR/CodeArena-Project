const User = require('../models/User');
const History = require('../models/History');
const { RANK_THRESHOLDS } = require('../utils/constants');

const DIFFICULTY_MULTIPLIERS = { easy: 1, medium: 2, hard: 3 };
const BASE_XP_PER_ANSWER = 10;

class ScoreService {
  async submitScore(userId, correctAnswers, difficulty, timeLeft, timeLimit, categoryId, bonusXP = 0) {
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty?.toLowerCase()] || 1;

    let speedBonus = 1;
    if (timeLeft !== undefined && timeLimit !== undefined && timeLimit > 0 && timeLeft >= 0) {
      speedBonus = 1 + (timeLeft / timeLimit);
    }

    const baseXP = Math.round(correctAnswers * BASE_XP_PER_ANSWER * difficultyMultiplier * speedBonus);
    const calculatedXP = baseXP + (bonusXP > 0 ? bonusXP : 0);

    const todayUTC = new Date().toISOString().slice(0, 10);
    const updateQuery = { $inc: { totalXP: calculatedXP, quizzesPlayed: 1 } };
    if (categoryId) {
      updateQuery.$inc[`categoryXP.${categoryId}`] = calculatedXP;
    }
    if (bonusXP > 0) {
      updateQuery.$set = { lastDailyChallengeDate: todayUTC };
    }

    const user = await User.findByIdAndUpdate(userId, updateQuery, { returnDocument: 'after' });
    if (!user) throw new Error('User not found');

    let newRank = 'Beginner';
    for (const { minXP, rank } of RANK_THRESHOLDS) {
      if (user.totalXP >= minXP) { newRank = rank; break; }
    }
    if (user.rank !== newRank) {
      user.rank = newRank;
      await user.save();
    }

    const historyData = {
      user: userId,
      correctAnswers,
      difficulty: difficulty || 'Easy',
      earnedXP: calculatedXP,
      timeLeft: timeLeft || 0,
      timeLimit: timeLimit || 0,
    };
    if (categoryId) historyData.category = categoryId;
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
    if (bonusXP > 0) result.bonusXP = bonusXP;
    return result;
  }
}

module.exports = new ScoreService();
