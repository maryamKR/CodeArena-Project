const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddleware');

// Public: Anyone can see the list of categories to choose from
router.get('/', categoryController.getCategories);

// Admin: Add a new category
router.post('/', protect, isAdmin, categoryController.addCategory);

module.exports = router;