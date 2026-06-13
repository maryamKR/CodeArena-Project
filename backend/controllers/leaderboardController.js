const leaderboardService = require('../services/leaderboardService');

/**
 * @desc    Get leaderboard
 * @route   GET /api/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const result = await leaderboardService.getLeaderboard(req.validated.query);
    res.status(200).json({ success: true, ...result });
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
    const data = await leaderboardService.getHallOfFame(req.validated?.query?.limit);
    res.status(200).json({ success: true, data });
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
    const data = await leaderboardService.getMyRank(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
