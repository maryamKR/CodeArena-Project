const questionService = require('../services/questionService');
const Question = require('../models/Question');

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

const checkAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { selectedAnswer } = req.validated.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const isCorrect = question.correct_answer === selectedAnswer;

    res.status(200).json({
      success: true,
      correct: isCorrect,
      correctAnswer: question.correct_answer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuiz, addQuestion, deleteQuestion, checkAnswer };