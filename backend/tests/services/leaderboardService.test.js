const leaderboardService = require('../../services/leaderboardService');
const User = require('../../models/User');

jest.mock('../../models/User');
jest.mock('../../models/History');

describe('Leaderboard Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getHallOfFame should query users ordered by totalXP', async () => {
    User.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([{ username: 'top1', totalXP: 5000 }])
    });

    const result = await leaderboardService.getHallOfFame(5);
    expect(User.find).toHaveBeenCalledWith({ totalXP: { $gt: 0 } });
    expect(result[0].username).toBe('top1');
  });

  it('getMyRank should accurately calculate placement positioning', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'u1', totalXP: 100 })
    });
    User.countDocuments.mockResolvedValue(4); // 4 users ahead

    const result = await leaderboardService.getMyRank('u1');
    expect(result.globalRank).toBe(5);
  });
});