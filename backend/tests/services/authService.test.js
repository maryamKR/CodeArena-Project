const authService = require('../../services/authService');
const User = require('../../models/User');
const { generateToken } = require('../../utils/tokenHelper');
const sendEmail = require('../../utils/sendEmail');

jest.mock('../../models/User');
jest.mock('../../utils/tokenHelper');
jest.mock('../../utils/sendEmail');

describe('Auth Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('register should correctly instantiate a user profile with starting fields', async () => {
    const userData = { username: 'testuser', email: 'test@test.com', password: 'password123' };
    User.create.mockResolvedValue({
      ...userData,
      _id: 'mockId',
      totalXP: 0,
      quizzesPlayed: 0,
      badges: [],
      rank: 'Beginner',
      streak: 0,
      isOnline: false,
      role: 'user',
      createdAt: new Date()
    });
    generateToken.mockReturnValue('mockToken123');

    const result = await authService.register(userData);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser', streak: 0 }));
    expect(result).toHaveProperty('token', 'mockToken123');
    expect(result.user.username).toBe('testuser');
  });

  it('login should throw error on invalid credentials', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await expect(authService.login('wrong@test.com', 'pwd')).rejects.toThrow('Invalid email or password');
  });
});