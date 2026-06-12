const { z } = require('zod');
const { OBJECT_ID_REGEX, DIFFICULTY_LEVELS } = require('../utils/constants');

const scoreSchema = z.object({
  body: z.object({
    correctAnswers: z.number().int().min(0),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    timeLeft: z.number().int().min(0).optional(),
    timeLimit: z.number().int().min(1).optional(),
    categoryId: z.string().regex(OBJECT_ID_REGEX, "Invalid category ID").optional()
  })
});

module.exports = { scoreSchema };
