const scoreService = require('../../services/scoreService');
const dailyChallengeService = require('../../services/dailyChallengeService');
const Question = require('../../models/Question');
const scoreController = require('../../controllers/scoreController');

// Mock dependencies
jest.mock('../../services/scoreService');
jest.mock('../../services/dailyChallengeService');
jest.mock('../../models/Question');



describe('Score Controller - submitScore', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock Express Request object setup matching your controller's structure
    req = {
      user: { _id: 'mockUserId123' },
      validated: {
        body: {
          answers: [
            { questionId: 'q1', selectedAnswer: 'A' },
            { questionId: 'q2', selectedAnswer: 'B' }
          ],
          difficulty: 'Medium',
          timeLeft: 30,
          timeLimit: 60,
          categoryId: 'cat123',
          isDailyChallenge: false
        }
      }
    };

    // Mock Express Response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock Express Next middleware trigger
    next = jest.fn();
  });

  it('should successfully submit score, calculate XP for correct answers, and return 200', async () => {
    // 1. Mock DB returning the correct answers for comparison
    const mockDbQuestions = [
      { _id: 'q1', correct_answer: 'A' }, // User got this right
      { _id: 'q2', correct_answer: 'C' }  // User got this wrong (selected B)
    ];
    Question.find.mockResolvedValue(mockDbQuestions);

    // 2. Mock service layer calculation result
    const mockServiceResult = {
      xpGained: 50,
      totalXP: 250,
      streak: 3
    };
    scoreService.submitScore.mockResolvedValue(mockServiceResult);

    // Run the controller function
    await scoreController.submitScore(req, res, next);

    // Assertions
    expect(Question.find).toHaveBeenCalledWith({ _id: { $in: ['q1', 'q2'] } });
    
    // It should evaluate that only 1 answer was correct ('q1')
    expect(scoreService.submitScore).toHaveBeenCalledWith(
      'mockUserId123',
      1, // correctAnswers counter
      'Medium',
      30,
      60,
      'cat123',
      0 // bonusXP is 0 because isDailyChallenge is false
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockServiceResult,
      message: 'Score submitted and XP updated successfully'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should include bonus XP when playing a daily challenge', async () => {
    // Modify request to be a daily challenge
    req.validated.body.isDailyChallenge = true;

    Question.find.mockResolvedValue([]);
    dailyChallengeService.getTodayBonusXP.mockResolvedValue(25); // Mock 25 Bonus XP
    scoreService.submitScore.mockResolvedValue({});

    await scoreController.submitScore(req, res, next);

    expect(dailyChallengeService.getTodayBonusXP).toHaveBeenCalled();
    expect(scoreService.submitScore).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number),
      expect.any(String),
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
      25 // Verifies bonus XP was passed through correctly
    );
  });

  it('should pass errors to the next middleware if an exception is thrown', async () => {
    const error = new Error('Database connection failed');
    Question.find.mockRejectedValue(error);

    await scoreController.submitScore(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});