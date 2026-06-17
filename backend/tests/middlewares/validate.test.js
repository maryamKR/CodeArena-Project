const validate = require('../../middlewares/validate');

describe('Validation Middleware Engine', () => {
  let req, res, next, mockSchema;

  beforeEach(() => {
    req = {
      body: { test: 'data' },
      query: {},
      params: {}
    };
    res = {};
    next = jest.fn();

    mockSchema = {
      parseAsync: jest.fn()
    };
  });

  it('should pass validated values to req.validated and execute next middleware', async () => {
    const parsedData = { body: { test: 'validated data' }, query: {}, params: {} };
    mockSchema.parseAsync.mockResolvedValue(parsedData);

    const validationMiddleware = validate(mockSchema);
    await validationMiddleware(req, res, next);

    expect(mockSchema.parseAsync).toHaveBeenCalledWith({
      body: req.body,
      query: req.query,
      params: req.params
    });
    expect(req.validated).toEqual(parsedData);
    expect(next).toHaveBeenCalledWith();
  });

  it('should forward schema evaluation errors straight to next()', async () => {
    const validationError = new Error('Schema format structural conflict');
    mockSchema.parseAsync.mockRejectedValue(validationError);

    const validationMiddleware = validate(mockSchema);
    await validationMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(validationError);
    expect(req.validated).toBeUndefined();
  });
});