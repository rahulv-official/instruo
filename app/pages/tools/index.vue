<script setup lang="ts">
const { data: tools } = await useAsyncData("tools", () => queryCollection("tools").all());

useSeoMeta({
  title: "All browser tools",
  description:
    "Search free browser utilities for text conversion, encoding, JSON formatting, counting, sorting, and cleanup.",
});
</script>

<template>
  <Catalogue
    :items="tools ?? []"
    title="Browser tools for quick jobs."
    description="Format JSON, clean text, encode data, count words, and generate IDs without installing another app."
    search-placeholder="Search tools, categories, or tasks…"
  />
</template>
