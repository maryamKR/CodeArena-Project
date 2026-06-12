const { z } = require('zod');

const usernameParamsSchema = z.object({
  params: z.object({
    username: z.string().min(3).max(30),
  }),
});

module.exports = {
  usernameParamsSchema,
};
