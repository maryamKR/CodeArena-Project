const errorHandler = require('../../middlewares/errorHandler');
const { ZodError } = require('zod');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    // Suppress console.error log output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should fall back to status 500 and return a generic error message', () => {
    const error = new Error('Generic system crash');
    
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Generic system crash'
    });
  });

  it('should format Zod validation errors with status 400', () => {
    const zodError = new ZodError([
      { path: ['email'], message: 'Invalid email address' },
      { path: ['password'], message: 'Password too short' }
    ]);

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid email address, Password too short'
    });
  });

  it('should handle MongoDB duplicate key index error (code 11000)', () => {
    const mongoError = new Error('Duplicate Key');
    mongoError.code = 11000;
    mongoError.keyValue = { email: 'duplicate@test.com' };

    errorHandler(mongoError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email already exists.'
    });
  });

  it('should format Mongoose ValidationError objects accurately', () => {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.errors = {
      username: { message: 'Username is required.' }
    };

    errorHandler(validationError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Username is required.'
    });
  });
});