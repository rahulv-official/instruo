<script setup lang="ts">
import type { GamesCollectionItem } from "@nuxt/content";

const route = useRoute();

const [{ data: page }, { data: allGames }] = await Promise.all([
  useAsyncData(
    route.path,
    () => queryCollection("games").path(route.path).first() as Promise<GamesCollectionItem>,
  ),
  useAsyncData("game_navigation", () => queryCollection("games").all()),
]);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Game not found", fatal: true });
}

useSeoMeta({
  title: page.value.title,
  description: page.value.description,
  ogTitle: page.value.title,
  ogDescription: page.value.description,
});
</script>

<template>
  <div
    v-if="page"
    class="grid w-full lg:grid-cols-[16rem_minmax(0,1fr)]"
  >
    <div
      class="border-default/70 px-5 pt-8 lg:min-h-[calc(100dvh-4rem)] lg:border-r lg:px-5 lg:py-10"
    >
      <ResourceSidebar
        :items="allGames ?? []"
        :current-path="route.path"
        kind="game"
      />
    </div>

    <main class="mx-auto w-full max-w-6xl min-w-0 px-5 pb-14 sm:px-8 lg:px-10 lg:py-12 xl:px-14">
      <nav
        aria-label="Breadcrumb"
        class="text-toned mb-8 flex items-center gap-2 font-mono text-xs"
      >
        <NuxtLink
          to="/games"
          class="hover:text-highlighted"
        >
          Games
        </NuxtLink>
        <span aria-hidden="true">/</span>
        <span>{{ page.category }}</span>
      </nav>

      <header class="border-default/70 border-b pb-10">
        <p class="text-toned mb-3 text-sm">{{ page.category }}</p>
        <h1
          class="text-highlighted max-w-5xl text-4xl leading-none font-semibold tracking-[-0.045em] text-balance sm:text-6xl"
        >
          {{ page.title }}
        </h1>
        <p class="text-muted mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {{ page.description }}
        </p>
      </header>

      <article class="mt-8">
        <ContentRenderer :value="page" />
      </article>
    </main>
  </div>
</template>
