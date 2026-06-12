const { z } = require('zod');
const { DIFFICULTY_LEVELS } = require('../utils/constants');

const questionSchema = z.object({
  body: z.object({
    text: z.string().min(10),
    correct_answer: z.boolean(),
    category: z.string().length(24), // Expects MongoDB ObjectId string
    difficulty: z.enum(DIFFICULTY_LEVELS)
  })
});

const quizQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    exclude: z.string().optional()
  })
});

module.exports = { questionSchema, quizQuerySchema };