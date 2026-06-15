const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// @route   GET /api/users/search
// @desc    Search for users to challenge
// @access  Private
router.get('/search', protect, userController.searchUsers);

module.exports = router;
