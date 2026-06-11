const { z } = require('zod');

const leaderboardSchema = z.object({
  query: z.object({
    category: z.string().optional(), // Can be objectId or slug
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

module.exports = { leaderboardSchema };
