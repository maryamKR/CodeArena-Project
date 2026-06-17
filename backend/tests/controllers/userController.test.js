const userController = require('../../controllers/userController');
const userService = require('../../services/userService');

jest.mock('../../services/userService');

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: { q: 'jo' }, user: { _id: 'u1' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('searchUsers should lookup users correctly', async () => {
    userService.searchUsers.mockResolvedValue([{ username: 'johndoe' }]);
    await userController.searchUsers(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ username: 'johndoe' }] });
  });
});