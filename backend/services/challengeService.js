const Challenge = require('../models/Challenge');
const User = require('../models/User');

/**
 * Send a challenge to another user
 */
exports.sendChallenge = async (senderId, senderUsername, receiverUsername, category, difficulty, message) => {
  // Prevent self-challenges
  if (senderUsername === receiverUsername.toLowerCase()) {
    const err = new Error('You cannot challenge yourself');
    err.statusCode = 400;
    throw err;
  }

  // Resolve receiver
  const receiver = await User.findOne({ username: receiverUsername.toLowerCase() });
  if (!receiver) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  let challenge;
  try {
    challenge = await Challenge.create({
      sender: senderId,
      receiver: receiver._id,
      category: category || null,
      difficulty: difficulty || 'Easy',
      message: message || '',
    });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error('You already have a pending challenge with this user');
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  await challenge.populate([
    { path: 'sender', select: 'username rank badges' },
    { path: 'receiver', select: 'username rank badges' },
    { path: 'category', select: 'name slug color' },
  ]);

  return { challenge, receiverUsername: receiver.username };
};

/**
 * Accept a pending challenge
 */
exports.acceptChallenge = async (challengeId, userId) => {
  const challenge = await Challenge.findOne({ challengeId });

  if (!challenge) {
    const err = new Error('Challenge not found');
    err.statusCode = 404;
    throw err;
  }

  // Only the intended receiver can accept
  if (challenge.receiver.toString() !== userId.toString()) {
    const err = new Error('You are not the receiver of this challenge');
    err.statusCode = 403;
    throw err;
  }

  // Only pending challenges can be accepted
  if (challenge.status !== 'pending') {
    const err = new Error(`Challenge cannot be accepted — current status is '${challenge.status}'`);
    err.statusCode = 400;
    throw err;
  }

  challenge.status = 'accepted';
  await challenge.save();

  await challenge.populate([
    { path: 'sender', select: 'username rank badges' },
    { path: 'receiver', select: 'username rank badges' },
    { path: 'category', select: 'name slug color' },
  ]);

  return challenge;
};

/**
 * Decline a pending challenge
 */
exports.declineChallenge = async (challengeId, userId) => {
  const challenge = await Challenge.findOne({ challengeId });

  if (!challenge) {
    const err = new Error('Challenge not found');
    err.statusCode = 404;
    throw err;
  }

  // Only the intended receiver can decline
  if (challenge.receiver.toString() !== userId.toString()) {
    const err = new Error('You are not the receiver of this challenge');
    err.statusCode = 403;
    throw err;
  }

  // Only pending challenges can be declined
  if (challenge.status !== 'pending') {
    const err = new Error(`Challenge cannot be declined — current status is '${challenge.status}'`);
    err.statusCode = 400;
    throw err;
  }

  challenge.status = 'declined';
  await challenge.save();

  await challenge.populate([
    { path: 'sender', select: 'username rank badges' },
    { path: 'receiver', select: 'username rank badges' },
    { path: 'category', select: 'name slug color' },
  ]);

  return challenge;
};

/**
 * Get all pending challenges for a user
 */
exports.getPendingChallenges = async (userId) => {
  return await Challenge.find({
    receiver: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .populate('sender', 'username rank badges isOnline')
    .populate('category', 'name slug color')
    .sort({ createdAt: -1 });
};
