const mongoose = require('mongoose');
const crypto = require('crypto');
const { DIFFICULTY_LEVELS, CHALLENGE_STATUSES } = require('../utils/constants');

const ChallengeSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      default: 'Easy',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [200, 'Challenge message cannot exceed 200 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: CHALLENGE_STATUSES,
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      // Challenges expire after 48 hours by default
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Index for efficiently querying a user's pending challenges
ChallengeSchema.index({ receiver: 1, status: 1 });
// Index for efficiently querying challenges sent by a user
ChallengeSchema.index({ sender: 1, status: 1 });
// TTL index to automatically remove expired challenges from the DB
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Database-level race condition prevention: Only one 'pending' challenge allowed between same sender & receiver
ChallengeSchema.index(
  { sender: 1, receiver: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

// Transform output to hide internal _id and __v
ChallengeSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret.challengeId;
    delete ret._id;
    delete ret.__v;
    delete ret.challengeId;
    return ret;
  },
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
