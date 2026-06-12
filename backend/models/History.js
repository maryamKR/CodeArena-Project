const mongoose = require("mongoose");
const { DIFFICULTY_LEVELS } = require("../utils/constants");

const HistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      default: "Easy",
    },
    earnedXP: {
      type: Number,
      required: true,
      default: 0,
    },
    timeLeft: {
      type: Number,
      default: 0,
    },
    timeLimit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

HistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("History", HistorySchema);
