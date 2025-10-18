<script lang="ts" setup>
const [{ data: tools }, { data: games }] = await Promise.all([
  useAsyncData("search_tools", () => queryCollectionSearchSections("tools")),
  useAsyncData("search_games", () => queryCollectionSearchSections("games")),
]);

const [{ data: toolsNav }, { data: gamesNav }] = await Promise.all([
  useAsyncData("search_tools_nav", () => queryCollectionNavigation("tools")),
  useAsyncData("search_games_nav", () => queryCollectionNavigation("games")),
]);

const files =
  tools.value && games.value ? [...tools.value, ...games.value] : [];

const nav =
  toolsNav.value && gamesNav.value
    ? [...toolsNav.value, ...gamesNav.value]
    : [];

provide("tools_navigation", toolsNav.value);
provide("games_navigation", gamesNav.value);
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
      class="dark:bg-black/10 bg-white/20 backdrop-blur-xl"
    />
  </UApp>
</template>
