<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items: NavigationMenuItem[] = [
  {
    label: "Tools",
    to: "/tools",
  },
  {
    label: "Games",
    to: "/games",
  },
  {
    label: "Contribute",
    to: "https://github.com/rahulv-official/instruo",
    target: "_blank",
  },
];
</script>

<template>
  <UFooter class="border-default/70 mt-20 border-t">
    <template #left>
      <div class="space-y-1">
        <p class="text-highlighted text-sm font-medium">Instruo</p>
        <p class="text-muted text-sm">Free browser tools. No account required.</p>
      </div>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/rahulv-official/instruo"
        target="_blank"
        aria-label="Instruo on GitHub"
      />
      <UButton
        icon="i-lucide-heart"
        color="neutral"
        variant="ghost"
        to="https://github.com/sponsors/rahul-vashishtha"
        target="_blank"
        aria-label="Sponsor Instruo"
      />
    </template>
  </UFooter>
</template>
