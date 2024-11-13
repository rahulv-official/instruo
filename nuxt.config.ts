// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@vueuse/motion/nuxt", "@nuxt/eslint", "@nuxt/fonts"],
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  eslint: {
    config: {
      standalone: false,
    },
  },

  fonts: {
    experimental: {
      processCSSVariables: true,
    },
    families: [
      {
        name: "Bricolage Grotesque",
        provider: "google",
      },
      {
        name: "Manrope",
        provider: "google",
      },
    ],
  },

  extends: ["shadcn-docs-nuxt"],

  compatibilityDate: "2024-11-11",
});
