const User = require('../models/User');
const Category = require('../models/Category');
const History = require('../models/History');
const mongoose = require('mongoose');

/**
 * @desc    Get leaderboard
 * @route   GET /api/leaderboard
 * @access  Public
 *
 * Query params:
 *  - category  (string)  slug or ObjectId — filter by category XP
 *  - difficulty (string) Easy | Medium | Hard — rank by XP earned in that difficulty
 *  - limit     (number)  default 10
 *
 * When difficulty is provided the leaderboard is derived from the History
 * collection via aggregation. When omitted the fast User index is used.
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { category, difficulty, limit = 10 } = req.validated.query;

    // ── Difficulty-based leaderboard ─────────────────────────────────────────
    // Aggregate History docs filtered by difficulty (and optionally category),
    // group by user, sum earnedXP, then populate user details.
    if (difficulty) {
      const matchStage = { difficulty };

      // Resolve category filter
      if (category) {
        let categoryId;
        if (mongoose.Types.ObjectId.isValid(category)) {
          categoryId = new mongoose.Types.ObjectId(category);
        } else {
          const categoryDoc = await Category.findOne({ slug: category });
          if (!categoryDoc) {
            return res.status(404).json({ success: false, message: 'Category not found' });
          }
          categoryId = categoryDoc._id;
        }
        matchStage.category = categoryId;
      }

      const results = await History.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$user',
            totalEarnedXP: { $sum: '$earnedXP' },
            quizzesPlayed: { $sum: 1 },
          },
        },
        { $sort: { totalEarnedXP: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: '$user._id',
            username: '$user.username',
            rank: '$user.rank',
            badges: '$user.badges',
            isOnline: '$user.isOnline',
            totalEarnedXP: 1,
            quizzesPlayed: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        filters: { difficulty, category: category || null },
        data: results,
      });
    }

    // ── Standard leaderboard (no difficulty filter) ───────────────────────────
    let sortQuery = { totalXP: -1 };
    let matchQuery = { totalXP: { $gt: 0 } };
    let categoryId = null;

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (!categoryDoc) {
          return res.status(404).json({ success: false, message: 'Category not found' });
        }
        categoryId = categoryDoc._id.toString();
      }

      sortQuery = { [`categoryXP.${categoryId}`]: -1 };
      matchQuery = { [`categoryXP.${categoryId}`]: { $gt: 0 } };
    }

    const topUsers = await User.find(matchQuery)
      .sort(sortQuery)
      .limit(limit)
      .select('username totalXP categoryXP rank badges isOnline');

    res.status(200).json({
      success: true,
      data: topUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get hall of fame
 * @route   GET /api/hall-of-fame
 * @access  Public
 */
exports.getHallOfFame = async (req, res, next) => {
  try {
    const requestedLimit = req.validated?.query?.limit || 10;
    const limit = Math.min(requestedLimit, 10); // Enforce max top 10

    const topUsers = await User.find({ totalXP: { $gt: 0 } })
      .sort({ totalXP: -1 })
      .limit(limit)
      .select('username totalXP badges rank');

    res.status(200).json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    next(error);
  }
};
