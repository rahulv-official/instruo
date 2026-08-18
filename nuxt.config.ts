import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  sourcemap: {
    server: false,
    client: false,
  },

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

  css: ["~/assets/css/main.css"],

  // Nuxt UI resolves its default icon set during module setup, before the
  // runtime app config is merged. Keep the build-time copy in sync so the
  // client bundle never asks for Lucide icons that are not installed.
  appConfig: {
    ui: {
      icons: {
        arrowDown: "i-tabler-arrow-down",
        arrowLeft: "i-tabler-arrow-left",
        arrowRight: "i-tabler-arrow-right",
        arrowUp: "i-tabler-arrow-up",
        caution: "i-tabler-alert-circle",
        check: "i-tabler-circle-check",
        chevronDoubleLeft: "i-tabler-chevrons-left",
        chevronDoubleRight: "i-tabler-chevrons-right",
        chevronDown: "i-tabler-chevron-down",
        chevronLeft: "i-tabler-chevron-left",
        chevronRight: "i-tabler-chevron-right",
        chevronUp: "i-tabler-chevron-up",
        close: "i-tabler-x",
        copy: "i-tabler-copy",
        copyCheck: "i-tabler-copy-check",
        dark: "i-tabler-moon",
        drag: "i-tabler-grip-vertical",
        ellipsis: "i-tabler-dots",
        error: "i-tabler-circle-x",
        external: "i-tabler-arrow-up-right",
        eye: "i-tabler-eye",
        eyeOff: "i-tabler-eye-off",
        file: "i-tabler-file",
        folder: "i-tabler-folder",
        folderOpen: "i-tabler-folder-open",
        hash: "i-tabler-hash",
        info: "i-tabler-info-circle",
        light: "i-tabler-sun",
        loading: "i-tabler-loader",
        menu: "i-tabler-menu-2",
        minus: "i-tabler-minus",
        panelClose: "i-tabler-layout-sidebar-left-collapse",
        panelOpen: "i-tabler-layout-sidebar-left-expand",
        plus: "i-tabler-plus",
        reload: "i-tabler-rotate",
        search: "i-tabler-search",
        stop: "i-tabler-square",
        star: "i-tabler-star",
        success: "i-tabler-circle-check",
        system: "i-tabler-device-desktop",
        tip: "i-tabler-bulb",
        upload: "i-tabler-upload",
        warning: "i-tabler-alert-triangle",
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    preference: "system",
    fallback: "light",
  },

  icon: {
    provider: "none",
    fallbackToApi: false,
    serverBundle: {
      collections: ["tabler"],
    },
    clientBundle: {
      // Scan first-party templates only. Nuxt UI ships Lucide defaults in its
      // dependency tree; scanning node_modules would pull unresolved names
      // into the bundle even though this app uses the local Tabler set. Content
      // frontmatter also contains dynamic catalogue icons, so include Markdown.
      scan: {
        globInclude: ["app/**/*.vue", "app/**/*.ts", "content/**/*.md"],
        globExclude: ["node_modules/**", ".nuxt/**", "dist/**"],
      },
    },
  },

  components: [
    {
      path: "~/components",
      global: true,
      pathPrefix: false,
      extensions: [".vue"],
    },
  ],
});
