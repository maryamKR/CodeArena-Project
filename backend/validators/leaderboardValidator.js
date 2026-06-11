const { z } = require('zod');

const leaderboardSchema = z.object({
  query: z.object({
    category: z.string().optional(), // Can be objectId or slug
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  })
});

const hallOfFameSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  }).optional()
});

module.exports = { leaderboardSchema, hallOfFameSchema };
