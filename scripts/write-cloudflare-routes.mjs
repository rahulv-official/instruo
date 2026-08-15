import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const routes = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_nuxt/*",
    "/_fonts/*",
    "/_og/s/*",
    "/_og-static-fonts/*",
    "/__nuxt_content/*",
    "/favicon.png",
    "/robots.txt",
    "/hero/*",
    "/images/*",
    "/me.png",
    "/me-1.png",
    "/instruo.png",
  ],
};

const invalidRules = [...routes.include, ...routes.exclude].filter((rule) => rule.length > 100);

if (invalidRules.length) {
  throw new Error(`Cloudflare route rules must be 100 characters or fewer: ${invalidRules.join(", ")}`);
}

const outputPath = resolve("dist/_routes.json");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(routes, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
