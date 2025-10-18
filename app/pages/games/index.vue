<script lang="ts" setup>
const { data: games } = await useAsyncData("games", () => {
  return queryCollection("games").all();
});

const selectedCategory = ref<string>("all");

const categories = computed(() => {
  if (!games.value) return ["all"];

  const uniqueCategories = new Set(games.value.map((game) => game.category));
  return ["all", ...Array.from(uniqueCategories)];
});

const filteredGames = computed(() => {
  if (!games.value) return [];

  if (selectedCategory.value === "all") {
    return games.value;
  }

  return games.value.filter((game) => game.category === selectedCategory.value);
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

    <div class="flex items-center justify-start gap-4 mt-8">
      <UPageCard
        v-for="game in filteredGames"
        :key="game.id"
        :title="game.title"
        :description="game.description"
        class="max-w-sm min-h-52 dark:bg-neutral-900/50 bg-neutral-50 hover:active:scale-[98%] cursor-pointer"
        :ui="{
          title: 'text-xl',
        }"
        :to="game.path"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <UBadge
            v-for="tag in game.tags"
            :key="game.id + tag"
            :label="tag"
            variant="soft"
          />
        </div>
      </UPageCard>
    </div>
  </div>
</template>
