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
    kind="tool"
    title="The right tool, without the detour."
    description="Search by task, browse a category, or reopen something recent. Every result opens ready to use."
    search-placeholder="Search tools, categories, or tasks…"
  />
</template>
