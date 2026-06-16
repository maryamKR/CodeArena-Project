const userService = require('../services/userService');

/**
 * @desc    Search users by username
 * @route   GET /api/users/search
 * @access  Private
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await userService.searchUsers(q, req.user._id);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};
