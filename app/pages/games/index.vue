<script setup lang="ts">
const { data: games } = await useAsyncData("games", () => queryCollection("games").all());

useSeoMeta({
  title: "Free browser games",
  description:
    "Play arcade, word, number, logic, and strategy games in your browser without creating an account.",
});
</script>

<template>
  <Catalogue
    :items="games ?? []"
    title="Browser games for a quick break."
    description="Open an arcade game or puzzle and play. No account, streak pressure, or setup between you and the board."
    search-placeholder="Search games or categories…"
  />
</template>
