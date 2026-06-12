const mongoose = require('mongoose');
const { DIFFICULTY_LEVELS } = require('../utils/constants');

/**
 * DailyChallenge — one document per calendar day (UTC).
 * The admin picks a category + difficulty; the frontend fetches
 * 10 matching questions via GET /api/questions.
 * activeDate is stored as a YYYY-MM-DD string so look-ups are
 * a simple equality check with no timezone math on the DB side.
 */
const DailyChallengeSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A category is required for the daily challenge'],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      required: [true, 'A difficulty level is required for the daily challenge'],
    },
    bonusXP: {
      type: Number,
      required: [true, 'Bonus XP is required'],
      min: [0, 'Bonus XP cannot be negative'],
      max: [10000, 'Bonus XP cannot exceed 10 000'],
    },
    // Stored as "YYYY-MM-DD" (UTC date) — unique index prevents duplicate days
    activeDate: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'activeDate must be in YYYY-MM-DD format'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('DailyChallenge', DailyChallengeSchema);
