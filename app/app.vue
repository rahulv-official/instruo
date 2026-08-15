<script lang="ts" setup>
const colorMode = useColorMode();
const title = "Instruo | Free browser tools for everyday tasks";
const description =
  "Use fast, private utilities for text, encoding, data, and quick browser games. No account or installation required.";

const [{ data: tools }, { data: games }] = await Promise.all([
  useAsyncData("search_tools", () => queryCollectionSearchSections("tools")),
  useAsyncData("search_games", () => queryCollectionSearchSections("games")),
]);

const [{ data: toolsNav }, { data: gamesNav }] = await Promise.all([
  useAsyncData("search_tools_nav", () => queryCollectionNavigation("tools", ["icon"])),
  useAsyncData("search_games_nav", () => queryCollectionNavigation("games", ["icon"])),
]);

const files = tools.value && games.value ? [...tools.value, ...games.value] : [];

const nav = toolsNav.value && gamesNav.value ? [...toolsNav.value, ...gamesNav.value] : [];

provide("tools_navigation", toolsNav.value);
provide("games_navigation", gamesNav.value);

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
});

useHead({
  htmlAttrs: { lang: "en" },
  titleTemplate: (pageTitle) => (pageTitle ? `${pageTitle} | Instruo` : title),
  link: [
    { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "32x32" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  ],
  meta: [
    {
      name: "theme-color",
      content: computed(() => (colorMode.value === "dark" ? "#08090a" : "#f4f5f7")),
    },
    { name: "color-scheme", content: "light dark" },
  ],
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UContentSearch
      :files="files"
      :navigation="nav"
      :color-mode="false"
      placeholder="Search tools and games…"
    />
  </UApp>
</template>
