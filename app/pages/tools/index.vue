<script lang="ts" setup>
const title = "All Tools - Instruo";
const description = "A collection of online tools designed for productivity and simplicity.";

const { data: tools } = await useAsyncData("tools", () => {
  return queryCollection("tools").all();
});

// Reactive category filter
const selectedCategory = ref<string>("all");

// Compute unique categories
const categories = computed(() => {
  if (!tools.value) return ["all"];

  const uniqueCategories = new Set(tools.value.map((tool) => tool.category));
  return ["all", ...Array.from(uniqueCategories)];
});

// Filter tools by selected category
const filteredTools = computed(() => {
  if (!tools.value) return [];

  if (selectedCategory.value === "all") {
    return tools.value;
  }

  return tools.value.filter((tool) => tool.category === selectedCategory.value);
});

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
});
</script>

<template>
  <div class="relative flex w-full flex-col items-center justify-center gap-8 p-8 max-lg:p-6">
    <h1
      class="pointer-events-none mt-4 bg-gradient-to-b from-black to-gray-500 bg-clip-text text-center text-4xl leading-none font-semibold tracking-tight text-pretty whitespace-pre-wrap text-transparent dark:from-white dark:to-gray-50/40"
    >
      All Tools
    </h1>

    <!-- Category Filter -->
    <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <UButton
        v-for="category in categories"
        :key="category"
        :label="category"
        :variant="selectedCategory === category ? 'soft' : 'outline'"
        :color="selectedCategory === category ? 'primary' : 'neutral'"
        class="rounded-full px-4 py-3 lowercase"
        size="lg"
        @click="selectedCategory = category"
      />
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
      <UPageCard
        v-for="tool in filteredTools"
        :key="tool.id"
        :title="tool.title"
        :description="tool.description"
        class="relative h-52 w-full max-w-md min-w-sm cursor-pointer bg-neutral-50 hover:active:scale-[98%] dark:bg-neutral-900/50"
        :ui="{
          title: 'text-xl',
        }"
        :to="tool.path"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            v-for="tag in tool.tags"
            :key="tool.id + tag"
            :label="tag"
            variant="soft"
            class="font-normal"
          />
        </div>
      </UPageCard>
    </div>
  </div>
</template>
