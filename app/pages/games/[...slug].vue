<script lang="ts" setup>
import type { GamesCollectionItem } from "@nuxt/content";

const route = useRoute();

const [{ data: page }, { data: surround }] = await Promise.all([
  useAsyncData(
    route.path,
    () => queryCollection("games").path(route.path).first() as Promise<GamesCollectionItem>,
  ),
  useAsyncData(`${route.path}-surround`, () => {
    return queryCollectionItemSurroundings("games", route.path, {
      fields: ["description"],
    });
  }),
]);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found",
    fatal: true,
  });
}
</script>

<template>
  <UPage
    v-if="page"
    class="container mx-auto max-w-4xl px-8 max-md:px-4"
  >
    <UPageHeader
      :title="page.title"
      :description="page.description"
      :headline="`${page.category} Games`"
    >
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <UBadge
          v-for="tag in page.tags"
          :key="page.path + tag"
          :label="tag"
          variant="soft"
        />
      </div>
    </UPageHeader>

    <UPageBody>
      <ContentRenderer
        v-if="page"
        :value="page"
      />

      <USeparator />

      <UContentSurround :surround="surround" />
    </UPageBody>
  </UPage>
</template>
