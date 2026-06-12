const { z } = require('zod');
const { DIFFICULTY_LEVELS, OBJECT_ID_REGEX } = require('../utils/constants');

const questionSchema = z.object({
  body: z.object({
    text: z.string().min(10, 'Question text must be at least 10 characters'),
    correct_answer: z.boolean('Correct answer must be a boolean'),
    difficulty: z.enum(DIFFICULTY_LEVELS, {
      errorMap: () => ({ message: `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}` })
    }),
    category: z.string().regex(OBJECT_ID_REGEX, 'Invalid category ID') // Expects MongoDB ObjectId string
  })
});

const quizQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    exclude: z.string().optional()
  })
});

const checkAnswerSchema = z.object({
  params: z.object({
    id: z.string().regex(OBJECT_ID_REGEX, 'Invalid question ID')
  }),
  body: z.object({
    selectedAnswer: z.boolean('selectedAnswer must be a boolean')
  })
});

module.exports = { questionSchema, quizQuerySchema, checkAnswerSchema };