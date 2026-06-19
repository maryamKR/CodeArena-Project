const categoryService = require('../../services/categoryService');
const Category = require('../../models/Category');
const Question = require('../../models/Question');

jest.mock('../../models/Category');
jest.mock('../../models/Question');

describe('Category Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createCategory should throw an error if the slug already exists', async () => {
    Category.findOne.mockResolvedValue({ slug: 'math' });
    await expect(categoryService.createCategory({ slug: 'math' })).rejects.toThrow('Category slug already exists');
  });

  it('getAllCategories should aggregate question counts onto category docs', async () => {
    const mockCategories = [
      { _id: 'cat1', name: 'Math', slug: 'math' },
      { _id: 'cat2', name: 'History', slug: 'history' }
    ];
    Category.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCategories) });
    Question.aggregate.mockResolvedValue([
      { _id: 'cat1', count: 15 }
    ]);

    const result = await categoryService.getAllCategories();
    expect(result[0].questionCount).toBe(15);
    expect(result[1].questionCount).toBe(0);
  });
});