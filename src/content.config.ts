import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.string().default('PURPOSE-BUILT APP'),
    status: z.enum(['live', 'beta', 'building', 'concept']).default('building'),
    url: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    icon: z.string().default('⚡'),
  }),
});

export const collections = { projects };
