const dailyChallengeService = require('../../services/dailyChallengeService');
const DailyChallenge = require('../../models/DailyChallenge');
const Category = require('../../models/Category');

jest.mock('../../models/DailyChallenge');
jest.mock('../../models/Category');

describe('Daily Challenge Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getToday should throw 404 error if no challenge matches the current date', async () => {
    DailyChallenge.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null)
    });

    await expect(dailyChallengeService.getToday()).rejects.toThrow('No daily challenge has been set for today');
  });

  it('setChallenge should update or insert data cleanly', async () => {
    Category.findById.mockResolvedValue({ _id: 'cat1' });
    DailyChallenge.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'dc1',
        category: 'cat1',
        difficulty: 'Hard',
        bonusXP: 50,
        activeDate: '2026-06-17'
      })
    });

    const result = await dailyChallengeService.setChallenge('cat1', 'Hard', 50, '2026-06-17', 'adminId');
    expect(result._id).toBe('dc1');
  });
});