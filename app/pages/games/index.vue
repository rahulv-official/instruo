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

    <div class="mt-8 flex items-center justify-start gap-4">
      <UPageCard
        v-for="game in filteredGames"
        :key="game.id"
        :title="game.title"
        :description="game.description"
        class="min-h-52 max-w-sm cursor-pointer bg-neutral-50 hover:active:scale-[98%] dark:bg-neutral-900/50"
        :ui="{
          title: 'text-xl',
        }"
        :to="game.path"
      >
        <div class="flex flex-wrap items-center gap-2">
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
