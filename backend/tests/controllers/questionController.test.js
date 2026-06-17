const questionController = require('../../controllers/questionController');
const questionService = require('../../services/questionService');
const Question = require('../../models/Question');

jest.mock('../../services/questionService');
jest.mock('../../models/Question');

describe('Question Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { validated: { query: {}, body: {} }, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('getQuiz should render standard array output', async () => {
    req.validated.query = { category: 'history', difficulty: 'Medium' };
    questionService.getQuizQuestions.mockResolvedValue([{}, {}]);

    await questionController.getQuiz(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('checkAnswer should evaluate correct answer choices seamlessly', async () => {
    req.params.id = 'q1';
    req.validated.body.selectedAnswer = 'A';
    Question.findById.mockResolvedValue({ correct_answer: 'A' });

    await questionController.checkAnswer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, correct: true, correctAnswer: 'A' });
  });
});