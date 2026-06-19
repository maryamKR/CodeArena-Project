const matchmakingController = require('../../controllers/matchmakingController');
const matchmakingService = require('../../services/matchmakingService');
const Category = require('../../models/Category');

jest.mock('../../services/matchmakingService');
jest.mock('../../models/Category');

describe('Matchmaking Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: { socketId: 'sock123', difficulty: 'Easy', categorySlug: 'math' },
      user: { _id: 'u1' },
      app: { get: jest.fn() }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('joinQueue should reject if no socketId is passed', async () => {
    req.body.socketId = null;
    await matchmakingController.joinQueue(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('joinQueue should confirm match initialization cleanly', async () => {
    Category.findOne.mockResolvedValue({ _id: 'cat1' });
    matchmakingService.joinQueue.mockResolvedValue({ matched: true, challengeId: 'ch1' });

    await matchmakingController.joinQueue(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'matched' }));
  });

  it('leaveQueue should confirm disconnection correctly', async () => {
    matchmakingService.leaveQueue.mockReturnValue(true);
    await matchmakingController.leaveQueue(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});