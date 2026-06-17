const leaderboardController = require('../../controllers/leaderboardController');
const leaderboardService = require('../../services/leaderboardService');

jest.mock('../../services/leaderboardService');

describe('Leaderboard Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { validated: { query: {} }, user: { _id: 'u1' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('getLeaderboard should retrieve ranked page array', async () => {
    leaderboardService.getLeaderboard.mockResolvedValue({ rankings: [] });
    await leaderboardController.getLeaderboard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getMyRank should identify current user placement indicators', async () => {
    leaderboardService.getMyRank.mockResolvedValue({ rank: 12 });
    await leaderboardController.getMyRank(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});