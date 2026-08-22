import { z } from 'zod';
import mongoose from 'mongoose';
import { PostStatus } from '@onecms/db';

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

// Category Schemas
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    description: z.string().max(1000).optional(),
    workspaceId: objectIdValidator.optional(),
  }).strict(),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: objectIdValidator,
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
    description: z.string().max(1000).optional(),
    workspaceId: objectIdValidator.optional(),
  }).strict(),
});

// Tag Schemas
export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    workspaceId: objectIdValidator.optional(),
  }).strict(),
});

export const updateTagSchema = z.object({
  params: z.object({
    id: objectIdValidator,
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
    workspaceId: objectIdValidator.optional(),
  }).strict(),
});

// Post Schemas
const seoSchema = z.object({
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().or(z.string()).optional(),
  ogImage: z.string().url().or(z.string()).optional(),
  keywords: z.string().max(500).optional(),
  noIndex: z.boolean().optional(),
});

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    excerpt: z.string().max(2000).optional(),
    content: z.string().optional(),
    status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']),
    authorId: objectIdValidator,
    categoryIds: z.array(objectIdValidator).optional(),
    tagIds: z.array(objectIdValidator).optional(),
    featuredImage: z.string().optional(),
    featuredMediaId: objectIdValidator.optional(),
    youtubeUrl: z.string().optional(),
    seo: seoSchema.optional(),
    workspaceId: objectIdValidator.optional(),
    publishedAt: z.string().datetime().optional(),
  }).strict(),
});

export const updatePostSchema = z.object({
  params: z.object({
    id: objectIdValidator,
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
    excerpt: z.string().max(2000).optional(),
    content: z.string().optional(),
    status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
    authorId: objectIdValidator.optional(),
    categoryIds: z.array(objectIdValidator).optional(),
    tagIds: z.array(objectIdValidator).optional(),
    featuredImage: z.string().optional(),
    featuredMediaId: objectIdValidator.optional(),
    youtubeUrl: z.string().optional(),
    seo: seoSchema.optional(),
    workspaceId: objectIdValidator.optional(),
    publishedAt: z.string().datetime().optional().nullable(),
  }).strict(),
});

// Query Schemas
export const listQuerySchema = z.object({
  query: z.object({
    page: z.union([z.string(), z.number()]).optional().default(1).transform(Number),
    limit: z.union([z.string(), z.number()]).optional().default(20).transform(Number),
    status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
    authorId: objectIdValidator.optional(),
    sort: z.string().optional(),
    dir: z.string().optional(),
    search: z.string().optional(),
  }).passthrough(),
});

export const byIdSchema = z.object({
  params: z.object({
    id: objectIdValidator,
  }),
});
