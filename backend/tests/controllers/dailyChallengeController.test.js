const dailyChallengeController = require('../../controllers/dailyChallengeController');
const dailyChallengeService = require('../../services/dailyChallengeService');
const User = require('../../models/User');

jest.mock('../../services/dailyChallengeService');
jest.mock('../../models/User');

describe('Daily Challenge Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { _id: 'u1' }, validated: { body: {} } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('getTodayChallenge should specify if user completed it today', async () => {
    dailyChallengeService.getToday.mockResolvedValue({ questionCount: 5 });
    const todayUTC = new Date().toISOString().slice(0, 10);
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ lastDailyChallengeDate: todayUTC })
    });

    await dailyChallengeController.getTodayChallenge(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { questionCount: 5, completedToday: true }
    });
  });

  it('setTodayChallenge should establish standard admin configurations', async () => {
    req.validated.body = { categoryId: 'cat1', difficulty: 'Hard', bonusXP: 50 };
    dailyChallengeService.setChallenge.mockResolvedValue({ id: 'dc1' });

    await dailyChallengeController.setTodayChallenge(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});