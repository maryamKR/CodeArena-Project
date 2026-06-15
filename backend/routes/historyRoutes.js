const express = require('express');
const router = express.Router();
const { getUserHistory, getAllHistory, getUserCategoryStats } = require('../controllers/historyController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { usernameParamsSchema } = require('../validators/historyValidator');

// GET /api/history
// Admin only global history
router.get('/', protect, authorize('admin'), getAllHistory);

// GET /api/history/stats/:username
// User or Admin can access
router.get('/stats/:username', protect, validate(usernameParamsSchema), getUserCategoryStats);

// GET /api/history/:username
// User or Admin can access
router.get('/:username', protect, validate(usernameParamsSchema), getUserHistory);

module.exports = router;
