const User = require('../models/User');
const Category = require('../models/Category');
const mongoose = require('mongoose');

/**
 * @desc    Get leaderboard
 * @route   GET /api/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { category, limit = 10 } = req.validated.query;
    
    let sortQuery = { totalXP: -1 };
    let matchQuery = { totalXP: { $gt: 0 } };
    let categoryId = null;

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        // Try to find by slug
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
      data: topUsers
    });
  } catch (error) {
    next(error);
  }
};
