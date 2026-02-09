import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const guide = defineCollection({
  loader: glob({ pattern: 'README.md', base: '.' }),
});

export const collections = { guide };
