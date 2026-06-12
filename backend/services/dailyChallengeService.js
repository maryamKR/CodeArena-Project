const DailyChallenge = require('../models/DailyChallenge');
const Category = require('../models/Category');

const todayUTC = () => new Date().toISOString().slice(0, 10);

const secondsUntilMidnightUTC = () => {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return Math.floor((midnight - now) / 1000);
};

class DailyChallengeService {
  async getToday() {
    const challenge = await DailyChallenge.findOne({ activeDate: todayUTC() })
      .populate('category', 'name slug color')
      .lean();

    if (!challenge) {
      const error = new Error('No daily challenge has been set for today');
      error.statusCode = 404;
      throw error;
    }

    return {
      _id:        challenge._id,
      category:   challenge.category,
      difficulty: challenge.difficulty,
      bonusXP:    challenge.bonusXP,
      activeDate: challenge.activeDate,
      resetsIn:   secondsUntilMidnightUTC(),
    };
  }

  async setChallenge(categoryId, difficulty, bonusXP, date, adminId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    const activeDate = date ?? todayUTC();

    const challenge = await DailyChallenge.findOneAndUpdate(
      { activeDate },
      { category: categoryId, difficulty, bonusXP, activeDate, createdBy: adminId },
      { new: true, upsert: true, runValidators: true }
    ).populate('category', 'name slug color');

    return {
      _id:        challenge._id,
      category:   challenge.category,
      difficulty: challenge.difficulty,
      bonusXP:    challenge.bonusXP,
      activeDate: challenge.activeDate,
      createdBy:  challenge.createdBy,
    };
  }

  async getTodayBonusXP() {
    const challenge = await DailyChallenge.findOne(
      { activeDate: todayUTC() },
      { bonusXP: 1 }
    ).lean();

    if (!challenge) {
      const error = new Error('No daily challenge has been set for today');
      error.statusCode = 404;
      throw error;
    }

    return challenge.bonusXP;
  }
}

module.exports = new DailyChallengeService();
