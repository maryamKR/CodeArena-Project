const questionService = require('../../services/questionService');
const Question = require('../../models/Question');
const Category = require('../../models/Category');

jest.mock('../../models/Question');
jest.mock('../../models/Category');

describe('Question Service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getQuizQuestions should aggregate random selection arrays with matching properties', async () => {
    Category.findOne.mockResolvedValue({ _id: 'cat1' });
    Question.aggregate.mockResolvedValue([{ _id: 'q1', text: 'What is 2+2?' }]);
    Question.populate.mockResolvedValue([{ _id: 'q1', text: 'What is 2+2?', category: { name: 'Math' } }]);

    const result = await questionService.getQuizQuestions({ categorySlug: 'math', difficulty: 'Easy' });
    expect(result).toHaveLength(1);
    expect(Question.aggregate).toHaveBeenCalled();
  });

  it('createQuestion should reject if the specified category configuration does not exist', async () => {
    Category.findById.mockResolvedValue(null);
    await expect(questionService.createQuestion({ category: 'invalid' })).rejects.toThrow('Invalid Category ID specified');
  });
});