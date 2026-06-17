// 1. Mock express-rate-limit BEFORE requiring your middleware file
jest.mock('express-rate-limit', () => {
  return jest.fn((options) => {
    // Return a dummy middleware function, but attach the configuration options 
    // directly onto it so we can easily read and verify them in our tests
    const mockMiddleware = (req, res, next) => next();
    mockMiddleware.mockOptions = options; 
    return mockMiddleware;
  });
});

const limiters = require('../../middlewares/rateLimiter');

describe('Rate Limiter Configurations', () => {
  it('should export all required specialized rate limiters', () => {
    expect(limiters.passwordResetLimiter).toBeDefined();
    expect(limiters.loginLimiter).toBeDefined();
    expect(limiters.registerLimiter).toBeDefined();
    expect(limiters.scoreLimiter).toBeDefined();
  });

  it('passwordResetLimiter should limit requests to 3 per hour', () => {
    const limiter = limiters.passwordResetLimiter;
    
    // Read directly from our mocked options configuration object
    expect(limiter.mockOptions).toBeDefined();
    expect(limiter.mockOptions.max).toBe(3);
    expect(limiter.mockOptions.windowMs).toBe(60 * 60 * 1000); // 1 hour
  });

  it('registerLimiter should allow 5 requests per hour max', () => {
    const limiter = limiters.registerLimiter;
    
    expect(limiter.mockOptions).toBeDefined();
    expect(limiter.mockOptions.max).toBe(5);
    expect(limiter.mockOptions.windowMs).toBe(60 * 60 * 1000); // 1 hour
  });
});