const DailyChallenge = require('../models/DailyChallenge');
const Category = require('../models/Category');

/** Returns today's date as a "YYYY-MM-DD" UTC string */
const todayUTC = () => new Date().toISOString().slice(0, 10);

/** Seconds remaining until next UTC midnight */
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
  /**
   * Returns the active daily challenge for today (UTC).
   * Populates category with name, slug, and color.
   *
   * @returns {Promise<Object>} Shaped challenge data including resetsIn
   * @throws  {Error} 404 if no challenge is set for today
   */
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

  /**
   * Creates or replaces the daily challenge for a given date.
   * Verifies the category exists before upserting.
   *
   * @param {string} categoryId  - Valid Category ObjectId
   * @param {string} difficulty  - 'Easy' | 'Medium' | 'Hard'
   * @param {number} bonusXP     - Flat bonus XP (0–10 000)
   * @param {string|null} date   - YYYY-MM-DD string, defaults to today UTC
   * @param {string} adminId     - ID of the admin creating the challenge
   * @returns {Promise<Object>}  Shaped challenge data
   * @throws  {Error} 404 if category does not exist
   */
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

  /**
   * Returns today's bonusXP for use in the score pipeline.
   * Throws 404 if no challenge is active.
   *
   * @returns {Promise<number>}
   */
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
