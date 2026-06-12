const { z } = require('zod');
const { OBJECT_ID_REGEX, DIFFICULTY_LEVELS } = require('../utils/constants');

const scoreSchema = z.object({
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string().regex(OBJECT_ID_REGEX, 'Invalid question ID'),
      selectedAnswer: z.boolean('Answer must be a boolean')
    })),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    timeLeft: z.number().int().min(0).optional(),
    timeLimit: z.number().int().min(1).optional(),
    categoryId: z.string().regex(OBJECT_ID_REGEX, "Invalid category ID").optional(),
    isDailyChallenge: z.boolean().optional(),
  })
});

module.exports = { scoreSchema };
