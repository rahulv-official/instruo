import type { DefinedCollection } from "@nuxt/content";
import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod/v4";

const schema = () =>
  z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()),
    icon: z
      .string()
      .regex(/^i-tabler-[a-z0-9-]+$/, "Icons must use a bundled Tabler name")
      .optional(),
    category: z.string(),
    aliases: z.array(z.string()).optional(),
    archetype: z.string().optional(),
    featuredRank: z.number().int().nonnegative().optional(),
    processing: z.enum(["local", "hybrid", "remote"]).optional(),
    capabilityStatus: z.enum(["verified", "partial", "planned"]).optional(),
  });

const collections: Record<string, DefinedCollection> = {
  tools: defineCollection({
    type: "page",
    source: "tools/**/*.md",
    schema: schema(),
  }),
  games: defineCollection({
    type: "page",
    source: "games/**/*.md",
    schema: schema(),
  }),
};

export default defineContentConfig({ collections });
