import { z } from 'zod';

export const postFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']),
  authorId: z.string().min(1, 'Author is required'),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  featuredImage: z.string().optional().default(''),
  youtubeUrl: z.string().optional().default(''),
  excerpt: z.string().optional().default(''),
  content: z.string().optional().default(''),
  seo: z.object({
    metaTitle: z.string().optional().default(''),
    metaDescription: z.string().optional().default(''),
    canonicalUrl: z.string().optional().default(''),
    ogImage: z.string().optional().default(''),
    keywords: z.string().optional().default(''),
    noIndex: z.boolean().optional().default(false),
  }).optional().default({
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    ogImage: '',
    keywords: '',
    noIndex: false,
  })
});

export type PostFormData = z.infer<typeof postFormSchema>;

export interface PostRevisionItem {
  id: string;
  eventType: string;
  userId?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  createdAt: string;
  metadata?: {
    snapshot?: Partial<PostFormData>;
  };
}
