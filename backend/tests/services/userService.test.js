const userService = require('../../services/userService');
const User = require('../../models/User');
const History = require('../../models/History');

jest.mock('../../models/User');
jest.mock('../../models/History');

describe('User Service Queries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searchUsers should return empty array if lookup string query is empty', async () => {
    const result = await userService.searchUsers('', 'currentUserId');
    expect(result).toEqual([]);
  });

  it('getUserCategoryStats should aggregate complete data metrics logs securely', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1' });
    History.aggregate.mockResolvedValue([
      { categoryName: 'Math', totalSolved: 40 }
    ]);

    const result = await userService.getUserCategoryStats('alex');
    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe('Math');
  });
});