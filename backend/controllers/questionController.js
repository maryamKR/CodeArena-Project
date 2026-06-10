const questionService = require('../services/questionService');

const getQuiz = async (req, res, next) => {
  try {
    const { category, difficulty, exclude } = req.validated.query;
    const excludeIds = exclude ? exclude.split(',') : [];

    const questions = await questionService.getQuizQuestions({
      categorySlug: category,
      difficulty,
      excludeIds
    }); 

    res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
};

const addQuestion = async (req, res, next) => {
  try {
    const newQuestion = await questionService.createQuestion(req.validated.body);
    res.status(201).json(newQuestion);
  } catch (error) {
    next(error); 
  }
};


const deleteQuestion = async (req, res, next) => {
  try {
    await questionService.deleteQuestion(req.params.id);
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getQuiz, addQuestion, deleteQuestion };