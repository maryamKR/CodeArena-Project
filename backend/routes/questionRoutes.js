const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { questionSchema, quizQuerySchema } = require('../validators/questionValidator');

// Public: Get quiz questions
router.get('/', validate(quizQuerySchema), questionController.getQuiz);



// Admin: Add a question
router.post(
  '/', 
  protect, 
  isAdmin, 
  validate(questionSchema), 
  questionController.addQuestion
);

// Admin: Delete a question
router.delete(
  '/:id', 
  protect, 
  isAdmin, 
  questionController.deleteQuestion
);

module.exports = router;