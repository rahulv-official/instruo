<script lang="ts" setup>
import type { ContentNavigationItem, ToolsCollectionItem } from "@nuxt/content";

const route = useRoute();

const [{ data: page }, { data: surround }] = await Promise.all([
  useAsyncData(
    route.path,
    () => queryCollection("tools").path(route.path).first() as Promise<ToolsCollectionItem>,
  ),
  useAsyncData(`${route.path}-surround`, () => {
    return queryCollectionItemSurroundings("tools", route.path, {
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

const nav = inject<Ref<ContentNavigationItem[]>>("tools_navigation");

useSeoMeta({
  title: `${page.value.title} - Instruo`,
  ogTitle: `${page.value.title} - Instruo`,
  description: `${page.value.description}`,
  ogDescription: `${page.value.description}`,
});
</script>

<template>
  <UPage
    v-if="page"
    class="container mx-auto px-8 max-md:px-4"
  >
    <UPageHeader
      :title="page.title"
      :description="page.description"
      :headline="`${page.category} Tool`"
    >
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <UBadge
          v-for="tag in page.tags"
          :key="page.path + tag"
          :label="tag"
          variant="soft"
          class="px-3 py-2 font-normal"
        />
      </div>
    </UPageHeader>

    <template #left>
      <UPageAside>
        <UContentNavigation :navigation="nav?.at(0)?.children" />
      </UPageAside>
    </template>

    <template #right />

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
