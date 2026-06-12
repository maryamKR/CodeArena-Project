const mongoose = require("mongoose");
const { DIFFICULTY_LEVELS } = require("../utils/constants");

const QuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    correct_answer: {
      type: Boolean,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Question", QuestionSchema);
