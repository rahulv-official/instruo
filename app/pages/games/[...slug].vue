<script setup lang="ts">
import type { GamesCollectionItem } from "@nuxt/content";

const route = useRoute();

const [{ data: page }, { data: allGames }] = await Promise.all([
  useAsyncData(
    route.path,
    () => queryCollection("games").path(route.path).first() as Promise<GamesCollectionItem>,
  ),
  useAsyncData("game_navigation", () =>
    queryCollection("games").select("id", "path", "title", "category", "icon").all(),
  ),
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
    class="grid w-full lg:grid-cols-[18.5rem_minmax(0,1fr)]"
  >
    <div
      class="border-muted bg-muted/35 px-5 pt-6 lg:min-h-[calc(100dvh-4rem)] lg:border-r lg:px-5 lg:py-7"
    >
      <ResourceSidebar
        :items="allGames ?? []"
        :current-path="route.path"
        kind="game"
      />
    </div>

    <main class="mx-auto w-full max-w-[90rem] min-w-0 px-5 pb-14 sm:px-8 lg:px-10 lg:py-7 xl:px-14">
      <nav
        aria-label="Breadcrumb"
        class="text-toned mb-5 flex items-center gap-2 text-sm"
      >
        <NuxtLink
          to="/games"
          class="hover:text-highlighted rounded-sm"
        >
          Games
        </NuxtLink>
        <UIcon
          name="i-tabler-chevron-right"
          class="text-dimmed size-4"
          aria-hidden="true"
        />
        <span>{{ page.category }}</span>
      </nav>

      <header class="border-muted border-b pb-6">
        <div class="flex items-start gap-4">
          <span
            class="border-muted bg-elevated text-toned flex size-11 shrink-0 items-center justify-center rounded-md border"
          >
            <UIcon
              :name="page.icon || 'i-tabler-device-gamepad-2'"
              class="size-6"
              aria-hidden="true"
            />
          </span>
          <div class="min-w-0">
            <p class="text-toned text-sm">{{ page.category }}</p>
            <h1
              id="game-title"
              class="text-highlighted mt-1 max-w-4xl text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
            >
              {{ page.title }}
            </h1>
          </div>
        </div>
        <p class="text-muted mt-4 max-w-2xl text-base leading-7">
          {{ page.description }}
        </p>
        <p class="text-toned mt-4 flex items-center gap-2 text-sm">
          <UIcon
            name="i-tabler-bolt"
            class="size-4"
            aria-hidden="true"
          />
          Play immediately. No account required.
        </p>
      </header>

      <article
        aria-labelledby="game-title"
        class="mt-6"
      >
        <ContentRenderer :value="page" />
      </article>
    </main>
  </div>
</template>
