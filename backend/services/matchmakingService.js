const Challenge = require('../models/Challenge');

/**
 * In-memory matchmaking queue.
 * Each entry: { userId, username, rank, socketId, difficulty, joinedAt }
 */
const queue = [];

class MatchmakingService {
  /**
   * Add a player to the queue. If a compatible opponent is found,
   * auto-pair them, create a Challenge, and emit 'matched' via Socket.IO.
   *
   * @returns {{ queued: true } | { matched: true, challengeId: string }}
   */
  async joinQueue(user, socketId, difficulty = 'Easy', categoryId = null, io) {
    // Prevent duplicate queue entries
    if (queue.some(p => p.userId === user._id.toString())) {
      return { alreadyQueued: true };
    }

    const entry = {
      userId: user._id.toString(),
      username: user.username,
      rank: user.rank,
      socketId,
      difficulty,
      categoryId,
      joinedAt: Date.now(),
    };

    // Try to find a compatible opponent (same difficulty, same category, different user)
    const opponentIndex = queue.findIndex(
      p => p.difficulty === difficulty && 
           (p.categoryId ? p.categoryId.toString() : null) === (categoryId ? categoryId.toString() : null) && 
           p.userId !== user._id.toString()
    );

    if (opponentIndex === -1) {
      // No opponent yet — join the queue and wait
      queue.push(entry);
      return { queued: true };
    }

    // Opponent found — remove them from the queue
    const [opponent] = queue.splice(opponentIndex, 1);

    // Create a Challenge document (status: accepted — both players consented via matchmaking)
    const challenge = await Challenge.create({
      sender: user._id,
      receiver: opponent.userId,
      difficulty,
      category: categoryId,
      message: 'Matchmaking challenge',
      status: 'accepted',
    });

    const challengeId = challenge.challengeId;

    // Notify both players via Socket.IO
    if (io) {
      io.to(opponent.socketId).emit('matched', {
        challengeId,
        opponent: { userId: user._id.toString(), username: user.username, rank: user.rank },
        message: 'Opponent found! Get ready.',
      });
      io.to(socketId).emit('matched', {
        challengeId,
        opponent: { userId: opponent.userId, username: opponent.username, rank: opponent.rank },
        message: 'Opponent found! Get ready.',
      });
    }

    return { matched: true, challengeId };
  }

  /**
   * Remove a player from the queue (cancel search).
   */
  leaveQueue(userId) {
    const index = queue.findIndex(p => p.userId === userId.toString());
    if (index !== -1) {
      queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a player from the queue on socket disconnect.
   */
  removeBySocketId(socketId) {
    const index = queue.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }

  /**
   * Return the current queue snapshot (for debugging / admin).
   */
  getQueueStatus() {
    return queue.map(({ username, rank, difficulty, joinedAt }) => ({
      username,
      rank,
      difficulty,
      waitingSince: Math.floor((Date.now() - joinedAt) / 1000) + 's',
    }));
  }
}

module.exports = new MatchmakingService();
