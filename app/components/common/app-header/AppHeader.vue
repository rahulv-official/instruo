<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Home",
    to: "/",
    active: route.path === "/",
  },
  {
    label: "Tools",
    to: "/tools",
    active: route.path.startsWith("/tools"),
  },
  // {
  //   label: "Games",
  //   to: "/games",
  //   active: route.path.startsWith("/games"),
  // },
  {
    label: "Sponsor",
    to: "https://github.com/sponsors/rahul-vashishtha",
    target: "_blank",
  },
]);
</script>

<template>
  <UHeader
    mode="drawer"
    title="instruo.org"
  >
    <UNavigationMenu :items="items" />

    <template #right>
      <UContentSearchButton />
      <UColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
      />
    </template>
  </UHeader>
</template>
