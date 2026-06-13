const User = require('../models/User');
const History = require('../models/History');
const { RANK_THRESHOLDS } = require('../utils/constants');

const DIFFICULTY_MULTIPLIERS = { easy: 1, medium: 2, hard: 3 };
const BASE_XP_PER_ANSWER = 10;

// ============================================================
// BADGE RULES
// ============================================================
const BADGE_RULES = [
  { name: 'First Blood', check: (user) => user.quizzesPlayed === 1 },
  { name: 'Perfect Score', check: (user, { correctAnswers }) => correctAnswers === 10 },
  { name: 'Speed Demon', check: (user, { timeLeft, timeLimit }) => timeLimit > 0 && timeLeft >= timeLimit * 0.7 },
  { name: '10 Wins', check: (user) => user.quizzesPlayed >= 10 },
  { name: 'Centurion', check: (user) => user.totalXP >= 100 },
  { name: 'XP Master', check: (user) => user.totalXP >= 1000 },
  { name: 'Streak 3', check: (user) => (user.streak || 0) >= 3 },
  { name: 'Streak 7', check: (user) => (user.streak || 0) >= 7 },
];

async function assignBadges(user, quizResult) {
  const currentBadges = user.badges || [];
  const newBadges = [];
  for (const rule of BADGE_RULES) {
    if (!currentBadges.includes(rule.name) && rule.check(user, quizResult)) {
      newBadges.push(rule.name);
    }
  }
  if (newBadges.length > 0) {
    user.badges = [...currentBadges, ...newBadges];
    await user.save();
  }
  return newBadges;
}

class ScoreService {
  async submitScore(userId, correctAnswers, difficulty, timeLeft, timeLimit, categoryId, bonusXP = 0) {
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty?.toLowerCase()] || 1;

    let speedBonus = 1;
    if (timeLeft !== undefined && timeLimit !== undefined && timeLimit > 0 && timeLeft >= 0) {
      speedBonus = 1 + (timeLeft / timeLimit);
    }

    const baseXP = Math.round(correctAnswers * BASE_XP_PER_ANSWER * difficultyMultiplier * speedBonus);
    const calculatedXP = baseXP + (bonusXP > 0 ? bonusXP : 0);

    const now = new Date();
    const todayUTC = now.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    const yesterdayUTC = yesterday.toISOString().slice(0, 10);

    const updateQuery = { $inc: { totalXP: calculatedXP, quizzesPlayed: 1 } };
    if (categoryId) {
      updateQuery.$inc[`categoryXP.${categoryId}`] = calculatedXP;
    }

    // Streak Logic
    const currentUser = await User.findById(userId).select('lastQuizDate streak lastDailyChallengeDate');
    if (!currentUser) throw new Error('User not found');

    let newStreak = currentUser.streak || 0;
    if (currentUser.lastQuizDate !== todayUTC) {
      if (currentUser.lastQuizDate === yesterdayUTC) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      updateQuery.$set = { lastQuizDate: todayUTC, streak: newStreak };
    }

    let user;
    if (bonusXP > 0) {
      if (currentUser.lastDailyChallengeDate === todayUTC) {
        const err = new Error("You have already completed today's daily challenge");
        err.statusCode = 409;
        throw err;
      }
      
      updateQuery.$set = { ...updateQuery.$set, lastDailyChallengeDate: todayUTC };
      user = await User.findByIdAndUpdate(userId, updateQuery, { returnDocument: 'after' });
    } else {
      user = await User.findByIdAndUpdate(userId, updateQuery, { returnDocument: 'after' });
    }

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

    const quizResult = {
      correctAnswers,
      timeLeft: timeLeft || 0,
      timeLimit: timeLimit || 0,
    };
    const newBadges = await assignBadges(user, quizResult);

    await History.create(historyData);

    const result = {
      earnedXP: calculatedXP,
      totalXP: user.totalXP,
      quizzesPlayed: user.quizzesPlayed,
      rank: user.rank,
      streak: user.streak,
      badges: user.badges,
      newBadges, 
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
