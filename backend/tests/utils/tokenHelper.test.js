const jwt = require('jsonwebtoken');
const tokenHelper = require('../../utils/tokenHelper');
const { TOKEN_EXPIRY_DAYS } = require('../../utils/constants');

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
}));

describe('TokenHelper Utility', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it('should sign a token using jwt.sign with the correct payload and duration', () => {
    const userId = 'user-id-123';
    const token = tokenHelper.generateToken(userId);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: userId },
      'test-secret-key',
      { expiresIn: `${TOKEN_EXPIRY_DAYS}d` }
    );
    expect(token).toBe('mocked-jwt-token');
  });
});