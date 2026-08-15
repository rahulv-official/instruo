<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => [
  { label: "Home", to: "/", active: route.path === "/" },
  { label: "Tools", to: "/tools", active: route.path.startsWith("/tools") },
  { label: "Games", to: "/games", active: route.path.startsWith("/games") },
]);
</script>

<template>
  <UHeader
    mode="drawer"
    class="border-muted bg-default/95 sticky top-0 border-b backdrop-blur-md transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    :ui="{
      container: 'h-16 max-w-368 px-5 sm:px-8 lg:px-10',
      content: 'bg-default rounded-lg',
      body: 'px-5 pb-6',
      toggle: 'rounded-md',
    }"
  >
    <template #left>
      <NuxtLink
        to="/"
        class="focus-visible:outline-primary flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Instruo home"
      >
        <img
          src="/logo.svg"
          alt=""
          width="28"
          height="28"
          class="size-7 shrink-0"
        />
        <span class="text-highlighted text-base font-semibold tracking-tight">Instruo</span>
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
      color="neutral"
      :ui="{
        link: 'min-h-9 rounded-md px-3 text-sm font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[active]:bg-elevated data-[active]:text-highlighted',
      }"
    />

    <template #right>
      <UContentSearchButton
        label="Search tools and games"
        :collapsed="false"
        color="neutral"
        variant="soft"
        class="bg-muted/70 text-muted hover:bg-muted hover:text-highlighted hidden min-w-60 justify-between text-left lg:flex"
      />
      <UContentSearchButton
        aria-label="Search tools and games"
        class="lg:hidden"
      />
      <UColorModeButton />
      <UButton
        icon="i-tabler-brand-github"
        aria-label="View Instruo on GitHub"
        color="neutral"
        variant="ghost"
        to="https://github.com/rahulv-official/instruo"
        target="_blank"
        rel="noopener noreferrer"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        variant="link"
        color="neutral"
      />
      <USeparator class="my-4" />
      <UButton
        label="View source on GitHub"
        icon="i-tabler-brand-github"
        color="neutral"
        variant="outline"
        to="https://github.com/rahulv-official/instruo"
        target="_blank"
        rel="noopener noreferrer"
        block
      />
    </template>
  </UHeader>
</template>
