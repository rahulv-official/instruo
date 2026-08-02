<script setup lang="ts">
const { data: tools } = await useAsyncData("tools", () => queryCollection("tools").all());

useSeoMeta({
  title: "All browser tools",
  description:
    "Search free browser utilities for image resizing, password generation, hashing, timestamp conversion, text, and data.",
});
</script>

<template>
  <Catalogue
    :items="tools ?? []"
    title="Browser tools for quick jobs."
    description="Resize images, generate passwords, format data, clean text, and create identifiers without installing another app."
    search-placeholder="Search tools, categories, or tasks…"
  />
</template>
