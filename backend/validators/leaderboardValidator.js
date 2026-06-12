const { z } = require('zod');
const { DIFFICULTY_LEVELS } = require('../utils/constants');

const leaderboardSchema = z.object({
  query: z.object({
    category: z.string().optional(), // Can be objectId or slug
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  })
});

const hallOfFameSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  }).optional()
});

module.exports = { leaderboardSchema, hallOfFameSchema };
