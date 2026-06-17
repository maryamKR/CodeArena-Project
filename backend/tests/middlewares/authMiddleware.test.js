const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Locate your middleware file path
const { protect, authorize } = require('../../middlewares/authMiddleware'); 


jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      cookies: {},
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('protect', () => {
    it('should authenticate user with valid token from cookies', async () => {
      req.cookies.token = 'valid_cookie_token';
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', username: 'tester' })
      });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_cookie_token', process.env.JWT_SECRET);
      expect(req.user).toEqual({ _id: 'user123', username: 'tester' });
      expect(next).toHaveBeenCalledWith();
    });

    it('should authenticate user with valid token from Authorization Header', async () => {
      req.headers.authorization = 'Bearer valid_bearer_token';
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123' })
      });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_bearer_token', process.env.JWT_SECRET);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail with 401 status if no token is provided', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail if token is invalid or expired', async () => {
      req.cookies.token = 'invalid_token';
      jwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('authorize', () => {
    it('should grant access if user role matches allowed roles', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin', 'moderator');
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should block access with 403 if user role does not match', () => {
      req.user = { role: 'user' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});