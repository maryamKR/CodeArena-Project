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

/**
 * @desc    Get today's active daily challenge (public)
 *          Returns category + difficulty so the frontend can call
 *          GET /api/questions?category=<slug>&difficulty=<level>
 * @route   GET /api/daily-challenge
 * @access  Public
 */
exports.getTodayChallenge = async (req, res, next) => {
  try {
    const challenge = await DailyChallenge.findOne({ activeDate: todayUTC() })
      .populate('category', 'name slug color')
      .lean();

    if (!challenge) {
      const error = new Error('No daily challenge has been set for today');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: challenge._id,
        category: challenge.category,
        difficulty: challenge.difficulty,
        bonusXP: challenge.bonusXP,
        activeDate: challenge.activeDate,
        resetsIn: secondsUntilMidnightUTC(), // seconds until reset
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set (or update) the daily challenge for a given date (admin only)
 * @route   POST /api/daily-challenge
 * @access  Private — Admin
 */
exports.setTodayChallenge = async (req, res, next) => {
  try {
    const { categoryId, difficulty, bonusXP, activeDate } = req.validated.body;

    // Verify the category actually exists
    const category = await Category.findById(categoryId);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      return next(error);
    }

    const date = activeDate ?? todayUTC();

    // Upsert: update if a challenge already exists for that date, else create
    const challenge = await DailyChallenge.findOneAndUpdate(
      { activeDate: date },
      {
        category: categoryId,
        difficulty,
        bonusXP,
        activeDate: date,
        createdBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('category', 'name slug color');

    res.status(201).json({
      success: true,
      data: {
        _id: challenge._id,
        category: challenge.category,
        difficulty: challenge.difficulty,
        bonusXP: challenge.bonusXP,
        activeDate: challenge.activeDate,
        createdBy: challenge.createdBy,
      },
      message: 'Daily challenge set successfully',
    });
  } catch (error) {
    next(error);
  }
};
