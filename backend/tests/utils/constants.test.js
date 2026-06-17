const constants = require('../../utils/constants');

describe('Constants Utility', () => {
  describe('OBJECT_ID_REGEX', () => {
    it('should validate correct MongoDB ObjectIDs', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(constants.OBJECT_ID_REGEX.test(validId)).toBe(true);
    });

    it('should reject invalid ObjectID formats', () => {
      const invalidId = 'not-an-object-id';
      expect(constants.OBJECT_ID_REGEX.test(invalidId)).toBe(false);
    });
  });

  describe('Configuration Arrays and Thresholds', () => {
    it('should have correct DIFFICULTY_LEVELS', () => {
      expect(constants.DIFFICULTY_LEVELS).toEqual(['Easy', 'Medium', 'Hard']);
    });

    it('should contain the expected rank progression structure', () => {
      expect(constants.USER_RANKS).toContain('Beginner');
      expect(constants.RANK_THRESHOLDS[0]).toEqual({ minXP: 10000, rank: 'Master' });
    });

    it('should define TOKEN_EXPIRY_DAYS as 30', () => {
      expect(constants.TOKEN_EXPIRY_DAYS).toBe(30);
    });
  });
});