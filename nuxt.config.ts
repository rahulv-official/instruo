import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/ui",
    "motion-v/nuxt",
    "@vueuse/nuxt",
    "nuxt-gtag",
  ],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    preference: "dark",
    fallback: "dark",
  },

  components: [
    {
      path: "~/components",
      global: true,
      pathPrefix: false,
    },
  ],
});
