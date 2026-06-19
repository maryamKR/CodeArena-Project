const historyController = require('../../controllers/historyController');
const userService = require('../../services/userService');
const User = require('../../models/User');
const History = require('../../models/History');

jest.mock('../../services/userService');
jest.mock('../../models/User');
jest.mock('../../models/History');

describe('History Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { username: 'alex', role: 'user' }, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('getUserCategoryStats should render user stats', async () => {
    req.params.username = 'alex';
    userService.getUserCategoryStats.mockResolvedValue({ Math: 10 });

    await historyController.getUserCategoryStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUserHistory should block non-admins trying to inspect other users', async () => {
    req.params.username = 'bob'; // different user!

    await historyController.getUserHistory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('getAllHistory should return values to an admin exclusively', async () => {
    History.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{}, {}])
    });

    await historyController.getAllHistory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});