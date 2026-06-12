const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { questionSchema, quizQuerySchema, checkAnswerSchema } = require('../validators/questionValidator');

// Protected: Get quiz questions
router.get('/', protect, validate(quizQuerySchema), questionController.getQuiz);

// Protected: Check individual question answer
router.post(
  '/:id/check',
  protect,
  validate(checkAnswerSchema),
  questionController.checkAnswer
);

// Admin: Add a question
router.post(
  '/', 
  protect, 
  authorize('admin'), 
  validate(questionSchema), 
  questionController.addQuestion
);

// Admin: Delete a question
router.delete(
  '/:id', 
  protect, 
  authorize('admin'), 
  questionController.deleteQuestion
);

module.exports = router;