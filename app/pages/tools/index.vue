<script lang="ts" setup>
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
</script>

<template>
  <div
    class="flex flex-col w-full items-center justify-center gap-8 relative p-8 max-lg:p-6"
  >
    <h1
      class="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-500 bg-clip-text text-4xl leading-none text-transparent dark:from-white dark:to-gray-50/40 text-pretty text-center font-semibold tracking-tight mt-4"
    >
      All Tools
    </h1>

    <!-- Category Filter -->
    <div class="flex items-center justify-center gap-2 flex-wrap mt-4">
      <UButton
        v-for="category in categories"
        :key="category"
        :label="category"
        :variant="selectedCategory === category ? 'soft' : 'outline'"
        :color="selectedCategory === category ? 'primary' : 'neutral'"
        class="lowercase rounded-full px-4 py-3"
        size="lg"
        @click="selectedCategory = category"
      />
    </div>

    <div class="flex flex-wrap items-center justify-center gap-4 mt-8">
      <UPageCard
        v-for="tool in filteredTools"
        :key="tool.id"
        :title="tool.title"
        :description="tool.description"
        class="max-w-md min-w-sm w-full h-52 dark:bg-neutral-900/50 bg-neutral-50 hover:active:scale-[98%] cursor-pointer relative"
        :ui="{
          title: 'text-xl',
        }"
        :to="tool.path"
      >
        <div class="flex items-center gap-2 flex-wrap">
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
