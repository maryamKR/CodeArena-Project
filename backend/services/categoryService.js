const Category = require('../models/Category');
const Question = require('../models/Question');

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
}

module.exports = new CategoryService();