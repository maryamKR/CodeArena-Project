const { z } = require('zod');
const { OBJECT_ID_REGEX, DIFFICULTY_LEVELS } = require('../utils/constants');

/**
 * Schema for admin setting a daily challenge.
 * The admin picks a category + difficulty — the frontend then calls
 * GET /api/questions?category=...&difficulty=... to load 10 questions.
 * activeDate defaults to today (UTC) in the controller if omitted.
 */
const setDailyChallengeSchema = z.object({
  body: z.object({
    categoryId: z
      .string({ required_error: 'categoryId is required' })
      .regex(OBJECT_ID_REGEX, 'Invalid category ID'),
    difficulty: z.enum(DIFFICULTY_LEVELS, {
      required_error: 'difficulty is required',
      invalid_type_error: `difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}`,
    }),
    bonusXP: z
      .number({ required_error: 'bonusXP is required' })
      .int('bonusXP must be an integer')
      .min(0, 'bonusXP cannot be negative')
      .max(10000, 'bonusXP cannot exceed 10 000'),
    activeDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'activeDate must be YYYY-MM-DD')
      .optional(),
  }),
});

module.exports = { setDailyChallengeSchema };
