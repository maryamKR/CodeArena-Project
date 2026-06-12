const Question = require("../models/Question");
const Category = require("../models/Category");
const mongoose = require("mongoose");

class QuestionService {
  /**
   * Fetch, exclude, shuffle, and limit questions
   */
  async getQuizQuestions({ categorySlug, difficulty, excludeIds = [] }) {
    const matchQuery = {};

    // 1. Conditionally resolve Category ID
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (!category) throw new Error("Category not found");
      matchQuery.category = category._id;
    }

    // 2. Conditionally add Difficulty
    if (difficulty) {
      matchQuery.difficulty = difficulty;
    }

    // 3. Handle Exclude IDs (using Mongoose ObjectId)
    if (excludeIds && excludeIds.length > 0) {
      const validExcludeIds = excludeIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validExcludeIds.length > 0) {
        matchQuery._id = { $nin: validExcludeIds };
      }
    }

    // 4. Aggregation Pipeline
    const questions = await Question.aggregate([
      { $match: matchQuery },
      { $sample: { size: 10 } },
      { $project: { correct_answer: 0 } },
    ]);

    // 5. Populate Category field
    return await Question.populate(questions, { path: "category" });
  }

  /**
   * Admin creates a new question
   */
  async createQuestion(questionData) {
    const categoryExists = await Category.findById(questionData.category);
    if (!categoryExists) {
      throw new Error("Invalid Category ID specified");
    }

    return await Question.create(questionData);
  }

  async deleteQuestion(questionId) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new Error("Invalid ID format");
    }
    const result = await Question.findByIdAndDelete(questionId);
    if (!result) {
      throw new Error("Question not found");
    }
    return result;
  }
}

module.exports = new QuestionService();
