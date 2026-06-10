const Category = require('../models/Category');

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
    return await Category.find({});
  }
}

module.exports = new CategoryService();