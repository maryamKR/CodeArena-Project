const User = require('../models/User');
const Category = require('../models/Category');
const History = require('../models/History');
const mongoose = require('mongoose');

class LeaderboardService {
  async getLeaderboard(filters) {
    const { category, difficulty, limit = 10 } = filters;

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
            throw err;
          }
          categoryId = categoryDoc._id;
        }
        matchStage.category = categoryId;
      }

      const results = await History.aggregate([
        { $match: matchStage },
        { $group: { _id: '$user', totalEarnedXP: { $sum: '$earnedXP' }, quizzesPlayed: { $sum: 1 } } },
        { $sort: { totalEarnedXP: -1 } },
        { $limit: Number(limit) },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        {
          $project: {
            _id: '$user._id',
            username: '$user.username',
            rank: '$user.rank',
            streak: '$user.streak',
            badges: '$user.badges',
            isOnline: '$user.isOnline',
            totalEarnedXP: 1,
            quizzesPlayed: 1,
          },
        },
      ]);

      return {
        filters: { difficulty, category: category || null },
        data: results,
      };
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
          throw err;
        }
        categoryId = categoryDoc._id.toString();
      }
      sortQuery = { [`categoryXP.${categoryId}`]: -1 };
      matchQuery = { [`categoryXP.${categoryId}`]: { $gt: 0 } };
    }

    const topUsers = await User.find(matchQuery)
      .sort(sortQuery)
      .limit(Number(limit))
      .select('username totalXP categoryXP rank streak badges isOnline quizzesPlayed');

    return { data: topUsers };
  }

  async getHallOfFame(requestedLimit = 10) {
    const limit = Math.min(Number(requestedLimit), 10);

    return await User.find({ totalXP: { $gt: 0 } })
      .sort({ totalXP: -1 })
      .limit(limit)
      .select('username totalXP badges rank streak');
  }

  async getMyRank(userId) {
    const user = await User.findById(userId).select('username totalXP rank badges streak');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const usersAhead = await User.countDocuments({ totalXP: { $gt: user.totalXP } });
    const globalRank = usersAhead + 1;
    const totalRanked = await User.countDocuments({ totalXP: { $gt: 0 } });

    return {
      globalRank,
      totalRanked,
      username: user.username,
      totalXP: user.totalXP,
      rank: user.rank,
      badges: user.badges,
      streak: user.streak,
    };
  }
}

module.exports = new LeaderboardService();
