const History = require('../models/History');
const User = require('../models/User');
const userService = require('../services/userService');

/**
 * @desc    Get questions solved per category for a user
 * @route   GET /api/history/stats/:username
 * @access  Private
 */
exports.getUserCategoryStats = async (req, res, next) => {
  try {
    const { username } = req.params;
    const stats = await userService.getUserCategoryStats(username);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's quiz history by username
 * @route   GET /api/history/:username
 * @access  Private (User themselves or Admin)
 */
exports.getUserHistory = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Authorization: User can only access their own history unless they are an admin
    if (req.user.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own history',
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const history = await History.find({ user: user._id })
      .populate('category', 'name slug color')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get global quiz history
 * @route   GET /api/history
 * @access  Private (Admin only)
 */
exports.getAllHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;

    const history = await History.find()
      .populate('user', 'username rank badges')
      .populate('category', 'name slug color')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
