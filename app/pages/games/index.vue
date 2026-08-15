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
    kind="game"
    title="Pick a game. Start playing."
    description="Arcade, word, number, logic, and strategy games built for keyboard and touch. No account gate."
    search-placeholder="Search games or categories…"
  />
</template>
