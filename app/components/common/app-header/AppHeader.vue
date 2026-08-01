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
  {
    label: "Games",
    to: "/games",
    active: route.path.startsWith("/games"),
  },
]);
</script>

<template>
  <UHeader
    mode="drawer"
    class="border-default/70 bg-default/90 sticky top-0 border-b backdrop-blur"
  >
    <template #title>
      <NuxtLink
        to="/"
        class="group flex items-center gap-3"
        aria-label="Instruo home"
      >
        <span
          class="bg-primary text-inverted flex size-8 items-center justify-center font-mono text-sm font-semibold"
        >
          I/
        </span>
        <span class="text-highlighted text-base font-semibold tracking-tight">Instruo</span>
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UContentSearchButton />
      <UColorModeButton />
      <UButton
        label="GitHub"
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/rahulv-official/instruo"
        target="_blank"
        class="max-sm:hidden"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        variant="link"
      />
      <USeparator class="my-4" />
      <UButton
        label="View source on GitHub"
        icon="i-simple-icons-github"
        color="neutral"
        variant="outline"
        to="https://github.com/rahulv-official/instruo"
        target="_blank"
        block
      />
    </template>
  </UHeader>
</template>
