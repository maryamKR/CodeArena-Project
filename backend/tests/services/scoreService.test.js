const scoreService = require('../../services/scoreService');
const User = require('../../models/User');
const History = require('../../models/History');

jest.mock('../../models/User');
jest.mock('../../models/History');

describe('Score Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submitScore should add calculated XP, update user level rank benchmarks, and log history profiles', async () => {
    const mockUser = {
      _id: 'u1',
      totalXP: 1050,
      quizzesPlayed: 5,
      rank: 'Beginner',
      badges: [],
      streak: 2,
      lastQuizDate: '2026-06-16',
      lastDailyChallengeDate: null,
      save: jest.fn()
    };
    
    // Mock the chainable findById().select() sequence
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Mock findByIdAndUpdate to return the updated user profile
    User.findByIdAndUpdate.mockResolvedValue(mockUser);
    History.create.mockResolvedValue({});

    const result = await scoreService.submitScore('u1', 10, 'hard', 10, 30, 'cat1', 0);
    
    expect(result).toHaveProperty('earnedXP');
    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(History.create).toHaveBeenCalled();
  });
});