const categoryController = require('../../controllers/categoryController');
const categoryService = require('../../services/categoryService');

jest.mock('../../services/categoryService');

describe('Category Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('getCategories should return all categories', async () => {
    categoryService.getAllCategories.mockResolvedValue([{ name: 'Math' }]);
    await categoryController.getCategories(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ name: 'Math' }]);
  });

  it('addCategory should create a new category', async () => {
    req.body = { name: 'Science' };
    categoryService.createCategory.mockResolvedValue({ id: 'cat1', name: 'Science' });
    await categoryController.addCategory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});