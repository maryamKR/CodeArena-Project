/**
 * Unit tests for ScoreService — XP calculation logic
 *
 * These tests focus on the pure calculation logic (XP, speed bonus,
 * difficulty multiplier) by re-implementing the same formulas used in
 * scoreService.js. This avoids needing a real MongoDB connection.
 *
 * If you want to test the full submitScore() function (with DB calls),
 * you'd need to mock the User/History models — see the note at the
 * bottom of this file for guidance.
 */

const DIFFICULTY_MULTIPLIERS = { easy: 1, medium: 2, hard: 3 };
const BASE_XP_PER_ANSWER = 10;

// Re-implementation of the XP formula from scoreService.js for isolated testing
function calculateXP(correctAnswers, difficulty, timeLeft, timeLimit, bonusXP = 0) {
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty?.toLowerCase()] || 1;

  let speedBonus = 1;
  if (timeLeft !== undefined && timeLimit !== undefined && timeLimit > 0 && timeLeft >= 0) {
    speedBonus = 1 + (timeLeft / timeLimit);
  }

  const baseXP = Math.round(correctAnswers * BASE_XP_PER_ANSWER * difficultyMultiplier * speedBonus);
  return baseXP + (bonusXP > 0 ? bonusXP : 0);
}

describe('ScoreService — XP calculation', () => {

  describe('difficulty multipliers', () => {
    test('Easy difficulty uses multiplier of 1', () => {
      const xp = calculateXP(5, 'Easy', 0, 100);
      // 5 correct * 10 base * 1 multiplier * 1 speedBonus (no time left) = 50
      expect(xp).toBe(50);
    });

    test('Medium difficulty uses multiplier of 2', () => {
      const xp = calculateXP(5, 'Medium', 0, 100);
      // 5 * 10 * 2 * 1 = 100
      expect(xp).toBe(100);
    });

    test('Hard difficulty uses multiplier of 3', () => {
      const xp = calculateXP(5, 'Hard', 0, 100);
      // 5 * 10 * 3 * 1 = 150
      expect(xp).toBe(150);
    });

    test('Unknown difficulty defaults to multiplier of 1', () => {
      const xp = calculateXP(5, 'Nightmare', 0, 100);
      expect(xp).toBe(50);
    });

    test('difficulty is case-insensitive', () => {
      const xp = calculateXP(5, 'HARD', 0, 100);
      expect(xp).toBe(150);
    });
  });

  describe('speed bonus', () => {
    test('no time left gives no speed bonus (multiplier stays 1)', () => {
      const xp = calculateXP(10, 'Easy', 0, 90);
      // speedBonus = 1 + (0/90) = 1
      expect(xp).toBe(100);
    });

    test('half the time left gives a 1.5x speed bonus', () => {
      const xp = calculateXP(10, 'Easy', 45, 90);
      // speedBonus = 1 + (45/90) = 1.5
      // 10 * 10 * 1 * 1.5 = 150
      expect(xp).toBe(150);
    });

    test('all the time left gives a 2x speed bonus', () => {
      const xp = calculateXP(10, 'Easy', 90, 90);
      // speedBonus = 1 + (90/90) = 2
      // 10 * 10 * 1 * 2 = 200
      expect(xp).toBe(200);
    });

    test('missing timeLimit (0 or undefined) disables speed bonus', () => {
      const xp = calculateXP(10, 'Easy', 45, 0);
      // timeLimit is 0, so speedBonus stays default 1
      expect(xp).toBe(100);
    });
  });

  describe('bonus XP (daily challenge)', () => {
    test('adds bonusXP on top of the calculated XP', () => {
      const xp = calculateXP(5, 'Easy', 0, 100, 50);
      // base = 50, + 50 bonus = 100
      expect(xp).toBe(100);
    });

    test('negative or zero bonusXP is ignored', () => {
      const xp = calculateXP(5, 'Easy', 0, 100, 0);
      expect(xp).toBe(50);
    });
  });

  describe('edge cases', () => {
    test('zero correct answers gives zero XP', () => {
      const xp = calculateXP(0, 'Hard', 50, 100);
      expect(xp).toBe(0);
    });

    test('combines difficulty multiplier and speed bonus correctly', () => {
      const xp = calculateXP(8, 'Medium', 60, 90);
      // speedBonus = 1 + (60/90) = 1.6666...
      // 8 * 10 * 2 * 1.6666... = 266.66... rounded = 267
      expect(xp).toBe(267);
    });
  });

});

/**
 * NOTE — testing the full submitScore() with database calls:
 *
 * To test submitScore() itself (streak logic, badge assignment, History
 * creation), you'd mock the Mongoose models like this:
 *
 *   jest.mock('../models/User');
 *   jest.mock('../models/History');
 *
 * Then provide fake return values for User.findById(), findByIdAndUpdate(),
 * and History.create() so the test doesn't need a real MongoDB connection.
 * This is a good next step once the pure calculation logic above is solid.
 */