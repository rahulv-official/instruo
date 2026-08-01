<script setup lang="ts">
interface CatalogueEntry {
  id: string;
  path: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  icon?: string;
}

const props = defineProps<{
  items: CatalogueEntry[];
  title: string;
  description: string;
  searchPlaceholder: string;
}>();

const route = useRoute();
const search = ref("");

const categories = computed(() => {
  return ["all", ...new Set(props.items.map((item) => item.category))];
});

const selectedCategory = computed({
  get: () => {
    const category = typeof route.query.category === "string" ? route.query.category : "all";
    return categories.value.includes(category) ? category : "all";
  },
  set: (category: string) => {
    navigateTo({
      path: route.path,
      query: category === "all" ? {} : { category },
    });
  },
});

function categoryLabel(category: string) {
  if (category === "all") return "All";
  if (category === "Developer") return "Developer Tools";
  return category;
}

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();

  return props.items
    .filter((item) => selectedCategory.value === "all" || item.category === selectedCategory.value)
    .filter((item) => {
      if (!query) return true;

      return [item.title, item.description, item.category, ...item.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .toSorted((a, b) => a.title.localeCompare(b.title));
});
</script>

<template>
  <UContainer class="py-12 sm:py-16 lg:py-20">
    <header class="border-default/70 border-b pb-10">
      <h1
        class="text-highlighted max-w-5xl text-4xl leading-[0.95] font-semibold tracking-[-0.045em] text-balance sm:text-6xl"
      >
        {{ title }}
      </h1>
      <p class="text-muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">
        {{ description }}
      </p>
      <p class="text-toned mt-5 font-mono text-xs">{{ items.length }} available</p>
    </header>

    <section
      aria-label="Catalogue filters"
      class="border-default/70 grid gap-5 border-b py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
    >
      <UInput
        v-model="search"
        :placeholder="searchPlaceholder"
        icon="i-lucide-search"
        size="xl"
        aria-label="Search catalogue"
        class="w-full lg:max-w-xl"
      />

      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="category in categories"
          :key="category"
          :label="categoryLabel(category)"
          :color="selectedCategory === category ? 'primary' : 'neutral'"
          :variant="selectedCategory === category ? 'soft' : 'ghost'"
          @click="selectedCategory = category"
        />
      </div>
    </section>

    <div class="text-toned py-5 font-mono text-xs">{{ filteredItems.length }} results</div>

    <div
      v-if="filteredItems.length"
      class="border-default/70 grid border-t border-l sm:grid-cols-2 xl:grid-cols-3"
    >
      <NuxtLink
        v-for="item in filteredItems"
        :key="item.id"
        :to="item.path"
        class="group focus-visible:ring-primary border-default/70 hover:bg-elevated/40 relative min-h-56 border-r border-b p-6 transition-colors duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none sm:p-7"
      >
        <article class="flex h-full flex-col">
          <div class="flex items-start justify-between gap-6">
            <UIcon
              :name="item.icon || 'i-lucide-wrench'"
              class="text-primary size-6"
            />
            <UIcon
              name="i-lucide-arrow-up-right"
              class="text-dimmed group-hover:text-highlighted size-5 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </div>

          <div class="mt-auto pt-12">
            <p class="text-toned mb-2 font-mono text-xs">{{ item.category }}</p>
            <h2 class="text-highlighted text-xl font-semibold tracking-tight">{{ item.title }}</h2>
            <p class="text-muted mt-2 line-clamp-2 text-sm leading-6">
              {{ item.description }}
            </p>
          </div>
        </article>
      </NuxtLink>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-search-x"
      title="No matching items"
      description="Try another term or show every category."
      class="border-default/70 border py-16"
    >
      <template #actions>
        <UButton
          label="Clear filters"
          color="neutral"
          variant="outline"
          @click="
            search = '';
            selectedCategory = 'all';
          "
        />
      </template>
    </UEmpty>
  </UContainer>
</template>
