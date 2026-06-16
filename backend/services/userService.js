const User = require('../models/User');
const History = require('../models/History');
const Category = require('../models/Category');
const mongoose = require('mongoose');

class UserService {
  /**
   * Search users by username (excluding current user)
   */
  async searchUsers(query, excludeUserId) {
    if (!query || query.trim() === '') {
      return [];
    }

    return await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: excludeUserId }
    })
      .select('username rank totalXP badges isOnline')
      .limit(10);
  }

  /**
   * Get category-specific statistics for a user
   */
  async getUserCategoryStats(username) {
    // Find the user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // Aggregate history data
    return await History.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$category',
          totalSolved: { $sum: '$correctAnswers' },
          totalAttempts: { $sum: 1 },
          avgTimeLeft: { $avg: '$timeLeft' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: '$categoryInfo.name',
          categorySlug: '$categoryInfo.slug',
          categoryColor: '$categoryInfo.color',
          totalSolved: 1,
          totalAttempts: 1,
          avgTimeLeft: { $round: ['$avgTimeLeft', 2] }
        }
      },
      { $sort: { totalSolved: -1 } }
    ]);
  }
}

module.exports = new UserService();
