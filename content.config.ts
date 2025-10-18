import type { DefinedCollection } from "@nuxt/content";
import { defineContentConfig, defineCollection, z } from "@nuxt/content";

const schema = () =>
  z.object({
    title: z.string(),
    tags: z.array(z.string()),
    icon: z.string().optional(),
    category: z.string(),
  });

const collections: Record<string, DefinedCollection> = {
  tools: defineCollection({
    type: "page",
    source: "tools/**/*.md",
    schema: schema(),
  }),
  games: defineCollection({
    type: "page",
    source: "games/**/*md",
    schema: schema(),
  }),
};

export default defineContentConfig({ collections });
