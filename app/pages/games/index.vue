<script setup lang="ts">
const { data: games } = await useAsyncData("games", () => queryCollection("games").all());

useSeoMeta({
  title: "Free browser games",
  description: "Play focused word and number games in your browser without creating an account.",
});
</script>

<template>
  <Catalogue
    :items="games ?? []"
    title="Word and number games."
    description="Open a puzzle and play. No account, streak pressure, or setup between you and the board."
    search-placeholder="Search games or categories…"
  />
</template>
