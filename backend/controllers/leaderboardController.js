const User = require('../models/User');
const Category = require('../models/Category');
const History = require('../models/History');
const mongoose = require('mongoose');

/**
 * @desc    Get leaderboard
 * @route   GET /api/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { category, difficulty, limit = 10 } = req.validated.query;

    if (difficulty) {
      const matchStage = { difficulty };

      if (category) {
        let categoryId;
        if (mongoose.Types.ObjectId.isValid(category)) {
          categoryId = new mongoose.Types.ObjectId(category);
        } else {
          const categoryDoc = await Category.findOne({ slug: category });
          if (!categoryDoc) {
            const err = new Error('Category not found');
            err.statusCode = 404;
            return next(err);
          }
          categoryId = categoryDoc._id;
        }
        matchStage.category = categoryId;
      }

      const results = await History.aggregate([
        { $match: matchStage },
        { $group: { _id: '$user', totalEarnedXP: { $sum: '$earnedXP' }, quizzesPlayed: { $sum: 1 } } },
        { $sort: { totalEarnedXP: -1 } },
        { $limit: limit },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
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

    let sortQuery = { totalXP: -1 };
    let matchQuery = { totalXP: { $gt: 0 } };
    let categoryId = null;

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (!categoryDoc) {
          const err = new Error('Category not found');
          err.statusCode = 404;
          return next(err);
        }
        categoryId = categoryDoc._id.toString();
      }
      sortQuery = { [`categoryXP.${categoryId}`]: -1 };
      matchQuery = { [`categoryXP.${categoryId}`]: { $gt: 0 } };
    }

    const topUsers = await User.find(matchQuery)
      .sort(sortQuery)
      .limit(limit)
      .select('username totalXP categoryXP rank badges isOnline quizzesPlayed');

    res.status(200).json({ success: true, data: topUsers });
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
    const limit = Math.min(requestedLimit, 10);

    const topUsers = await User.find({ totalXP: { $gt: 0 } })
      .sort({ totalXP: -1 })
      .limit(limit)
      .select('username totalXP badges rank');

    res.status(200).json({ success: true, data: topUsers });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the authenticated user's global rank
 * @route   GET /api/leaderboard/me
 * @access  Private
 */
exports.getMyRank = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('username totalXP rank badges');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const usersAhead = await User.countDocuments({ totalXP: { $gt: user.totalXP } });
    const globalRank = usersAhead + 1;
    const totalRanked = await User.countDocuments({ totalXP: { $gt: 0 } });

    res.status(200).json({
      success: true,
      data: { globalRank, totalRanked, username: user.username, totalXP: user.totalXP, rank: user.rank, badges: user.badges },
    });
  } catch (error) {
    next(error);
  }
};
