const { z } = require('zod');

const scoreSchema = z.object({
  body: z.object({
    correctAnswers: z.number().int().min(0),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    timeLeft: z.number().int().min(0).optional(),
    timeLimit: z.number().int().min(1).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional()
  })
});

module.exports = { scoreSchema };
