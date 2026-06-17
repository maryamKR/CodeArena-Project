const authController = require('../../controllers/authController');
const authService = require('../../services/authService');
const User = require('../../models/User');

jest.mock('../../services/authService');
jest.mock('../../models/User');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      validated: { body: {}, params: {} },
      user: null
    };
    res = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('registerUser should register and set cookie', async () => {
    req.validated.body = { email: 'test@test.com' };
    authService.register.mockResolvedValue({ user: { id: '1' }, token: 'token123' });

    await authController.registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith('token', 'token123', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  it('loginUser should authenticate and set cookie', async () => {
    req.validated.body = { email: 't@t.com', password: '123' };
    authService.login.mockResolvedValue({ user: { id: '1' }, token: 'token123' });

    await authController.loginUser(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith('token', 'token123', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  it('getMe should reset streak if user missed yesterday and today', async () => {
    req.user = {
      _id: 'uid',
      lastQuizDate: '2020-01-01', // old date
      streak: 5
    };

    await authController.getMe(req, res, next);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('uid', { streak: 0 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('logoutUser should clear token cookie', () => {
    authController.logoutUser(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forgotPassword should call service and send email status', async () => {
    req.validated.body = { email: 't@t.com' };
    await authController.forgotPassword(req, res, next);
    expect(authService.forgotPassword).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('resetPassword should change password and sign user in', async () => {
    req.validated.params.resetToken = 'rst123';
    req.validated.body.password = 'newpwd';
    authService.resetPassword.mockResolvedValue({ user: { id: '1' }, token: 'tok' });

    await authController.resetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('token', 'tok', expect.any(Object));
  });
});