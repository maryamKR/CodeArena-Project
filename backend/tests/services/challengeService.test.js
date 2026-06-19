const challengeService = require('../../services/challengeService');
const Challenge = require('../../models/Challenge');
const User = require('../../models/User');

jest.mock('../../models/Challenge');
jest.mock('../../models/User');

describe('Challenge Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sendChallenge should block a user from challenging themselves', async () => {
    await expect(
      challengeService.sendChallenge('id1', 'alex', 'alex', 'math', 'Easy', '')
    ).rejects.toThrow('You cannot challenge yourself');
  });

  it('sendChallenge should throw an error if the receiver is missing', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(
      challengeService.sendChallenge('id1', 'alex', 'unknown_user', 'math', 'Easy', '')
    ).rejects.toThrow('User not found');
  });

  it('declineChallenge should decline a pending challenge', async () => {
    const mockChallenge = {
      receiver: 'user2',
      status: 'pending',
      save: jest.fn(),
      populate: jest.fn().mockReturnThis()
    };
    Challenge.findOne.mockResolvedValue(mockChallenge);

    const result = await challengeService.declineChallenge('ch123', 'user2');
    expect(mockChallenge.status).toBe('declined');
    expect(mockChallenge.save).toHaveBeenCalled();
  });
});