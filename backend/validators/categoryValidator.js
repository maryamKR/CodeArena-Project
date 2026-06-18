const { z } = require('zod');
const { OBJECT_ID_REGEX } = require('../utils/constants');

const categorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Category name must be at least 2 characters')
      .max(50, 'Category name cannot exceed 50 characters')
      .trim(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    color: z
      .string()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex code (e.g., #e34c26)')
  })
});

const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(OBJECT_ID_REGEX, 'Invalid category ID format')
  })
});

module.exports = {
  categorySchema,
  deleteCategorySchema
};