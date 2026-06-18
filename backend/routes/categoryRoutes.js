const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public: Anyone can see the list of categories to choose from
router.get('/', categoryController.getCategories);

// Admin: Add a new category
router.post('/', protect, authorize('admin'), categoryController.addCategory);

// Admin: Delete a category
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;

