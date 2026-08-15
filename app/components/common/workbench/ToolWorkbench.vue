<script setup lang="ts">
const props = withDefaults(defineProps<{ description?: string }>(), {
  description: "Results update as your input changes.",
});
</script>

<template>
  <section class="not-prose bg-muted/70 ring-muted rounded-lg p-1 ring-1">
    <div
      class="bg-elevated overflow-hidden rounded-md shadow-[0_1px_2px_rgb(0_0_0/0.04),inset_0_1px_0_rgb(255_255_255/0.45)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.035)]"
    >
      <header class="border-muted bg-muted/20 border-b px-5 py-4 sm:px-6">
        <p class="text-muted text-sm leading-6">{{ props.description }}</p>
      </header>

      <div class="p-5 sm:p-6 lg:p-7">
        <slot />
      </div>
    </div>
  </section>
</template>
