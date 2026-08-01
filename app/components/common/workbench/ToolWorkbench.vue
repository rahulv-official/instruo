<script setup lang="ts">
const props = withDefaults(defineProps<{ description?: string }>(), {
  description: "Results update as your input changes.",
});
</script>

<template>
  <section class="not-prose border-default/70 bg-default border">
    <header class="border-default/70 border-b px-4 py-4 sm:px-6">
      <p class="text-muted text-sm leading-6">{{ props.description }}</p>
    </header>

    <div class="p-4 sm:p-6 lg:p-8">
      <slot />
    </div>
  </section>
</template>
