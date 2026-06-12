const { z } = require('zod');
const { OBJECT_ID_REGEX, DIFFICULTY_LEVELS } = require('../utils/constants');

/** Validates the body of POST /api/challenges */
const sendChallengeSchema = z.object({
  body: z.object({
    receiverUsername: z
      .string({ required_error: 'receiverUsername is required' })
      .min(3, 'receiverUsername must be at least 3 characters'),
    category: z
      .string()
      .regex(OBJECT_ID_REGEX, 'Invalid category ID')
      .optional(),
    difficulty: z
      .enum(DIFFICULTY_LEVELS)
      .optional(),
    message: z
      .string()
      .max(200, 'Message cannot exceed 200 characters')
      .optional(),
  }),
});

/** Validates the :id param for PUT /api/challenges/:id/accept and decline */
const challengeIdSchema = z.object({
  params: z.object({
    id: z.uuid({ message: 'Invalid challenge ID format (must be a UUID)' }),
  }),
});

module.exports = { sendChallengeSchema, challengeIdSchema };
