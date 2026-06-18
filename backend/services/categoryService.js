const Category = require('../models/Category');
const Question = require('../models/Question');
const mongoose = require('mongoose');

class CategoryService {
  /**
   * Create a new category
   * @param {Object} categoryData - { name, slug, color }
   */
  async createCategory(categoryData) {
    // Check if slug already exists to prevent duplicate keys throwing  errors
    const existing = await Category.findOne({ slug: categoryData.slug });
    if (existing) {
      throw new Error('Category slug already exists');
    }
    
    return await Category.create(categoryData);
  }

  /**
   * Get all available categories
   */
  async getAllCategories() {
    const categories = await Category.find({}).lean();
    
    // Get question counts for all categories in one go
    const questionCounts = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    questionCounts.forEach(item => {
      if (item._id) {
        countMap[item._id.toString()] = item.count;
      }
    });

    return categories.map(cat => ({
      ...cat,
      questionCount: countMap[cat._id.toString()] || 0
    }));
  }

  /**
   * Delete a category by ID
   * @param {string} categoryId 
   */
  async deleteCategory(categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new Error('Invalid Category ID');
    }

    // Check if category has associated questions
    const questionCount = await Question.countDocuments({ category: categoryId });
    if (questionCount > 0) {
      throw new Error('Cannot delete category with existing questions');
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }
}

module.exports = new CategoryService();
