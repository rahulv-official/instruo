import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/ui",
    "@nuxt/content",
    "@vueuse/nuxt",
    "nuxt-gtag",
  ],

  alias: {
    "#wordle-answers": new URL("./node_modules/wordles/wordles.json", import.meta.url).pathname,
    "#wordle-guesses": new URL("./node_modules/wordles/nonwordles.json", import.meta.url).pathname,
  },

  nitro: {
    preset: "cloudflare-pages",
  },

  routeRules: {
    "/games/encoder-decoder/wordle": { redirect: "/games/word/wordle" },
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    preference: "system",
    fallback: "light",
  },

  icon: {
    provider: "none",
    clientBundle: {
      scan: true,
    },
  },

  components: [
    {
      path: "~/components",
      global: true,
      pathPrefix: false,
    },
  ],
});
