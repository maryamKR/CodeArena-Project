const matchmakingService = require('../services/matchmakingService');

/**
 * @desc  Join the matchmaking queue
 * @route POST /api/matchmaking/join
 * @access Private
 *
 * Body:
 *  - difficulty  (string)  Easy | Medium | Hard  — optional, default 'Easy'
 */
exports.joinQueue = async (req, res, next) => {
  try {
    const { difficulty = 'Easy' } = req.body;
    const user = req.user;

    // Retrieve the io instance attached to the app
    const io = req.app.get('io');

    // Retrieve the player's socketId sent from the client
    const { socketId } = req.body;

    if (!socketId) {
      return res.status(400).json({
        success: false,
        error: 'socketId is required. Connect to the Socket.IO server first and send your socket ID.',
      });
    }

    const result = await matchmakingService.joinQueue(user, socketId, difficulty, io);

    if (result.alreadyQueued) {
      return res.status(409).json({
        success: false,
        error: 'You are already in the matchmaking queue.',
      });
    }

    if (result.matched) {
      return res.status(200).json({
        success: true,
        status: 'matched',
        challengeId: result.challengeId,
        message: 'Opponent found! Navigate to the match.',
      });
    }

    // Queued, waiting for an opponent
    res.status(202).json({
      success: true,
      status: 'queued',
      message: 'Joined the matchmaking queue. You will be notified via Socket.IO when an opponent is found.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Leave the matchmaking queue
 * @route DELETE /api/matchmaking/leave
 * @access Private
 */
exports.leaveQueue = async (req, res, next) => {
  try {
    const removed = matchmakingService.leaveQueue(req.user._id);

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'You are not currently in the matchmaking queue.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'You have left the matchmaking queue.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get current queue status (admin only)
 * @route GET /api/matchmaking/status
 * @access Private (admin)
 */
exports.getQueueStatus = (req, res) => {
  const status = matchmakingService.getQueueStatus();
  res.status(200).json({
    success: true,
    playersWaiting: status.length,
    queue: status,
  });
};
