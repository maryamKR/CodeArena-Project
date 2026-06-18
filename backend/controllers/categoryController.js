const categoryService = require('../services/categoryService');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const newCategory = await categoryService.createCategory(req.body);
    res.status(201).json(newCategory);
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const deletedCategory = await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully', category: deletedCategory });
  } catch (err) {
    if (err.message === 'Category not found') {
      res.status(404);
    } else if (err.message === 'Cannot delete category with existing questions') {
      res.status(400);
    }
    next(err);
  }
};
