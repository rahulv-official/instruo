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
  kind: "tool" | "game";
  title: string;
  description: string;
  searchPlaceholder: string;
}>();

const route = useRoute();
const search = ref("");
const recentPaths = useLocalStorage<string[]>(`instruo-recent-${props.kind}s`, []);

const categoryOptions = computed(() => [
  { label: "All", value: "all", count: props.items.length },
  ...[...new Set(props.items.map((item) => item.category))]
    .toSorted((a, b) => a.localeCompare(b))
    .map((category) => ({
      label: category === "Developer" ? "Developer Tools" : category,
      value: category,
      count: props.items.filter((item) => item.category === category).length,
    })),
]);

const categories = computed(() => categoryOptions.value.map((option) => option.value));

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

const toolGroups = computed(() => {
  const groups = new Map<string, CatalogueEntry[]>();
  for (const item of filteredItems.value) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  return [...groups.entries()].toSorted(([a], [b]) => a.localeCompare(b));
});

const recentItems = computed(() =>
  recentPaths.value
    .map((path) => props.items.find((item) => item.path === path))
    .filter((item): item is CatalogueEntry => Boolean(item))
    .slice(0, 4),
);

const featuredGamePaths = [
  "/games/arcade/flappy-bird",
  "/games/arcade/tetris",
  "/games/logic/sokoban",
];

const featuredGames = computed(() =>
  featuredGamePaths
    .map((path) => props.items.find((item) => item.path === path))
    .filter((item): item is CatalogueEntry => Boolean(item)),
);

const showFeaturedGames = computed(
  () => props.kind === "game" && !search.value.trim() && selectedCategory.value === "all",
);

const visibleGames = computed(() => {
  if (!showFeaturedGames.value) return filteredItems.value;
  const featured = new Set(featuredGamePaths);
  return filteredItems.value.filter((item) => !featured.has(item.path));
});

function remember(item: CatalogueEntry) {
  recentPaths.value = [item.path, ...recentPaths.value.filter((path) => path !== item.path)].slice(
    0,
    8,
  );
}

function clearFilters() {
  search.value = "";
  selectedCategory.value = "all";
}

onKeyStroke("/", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
  event.preventDefault();
  document.querySelector<HTMLInputElement>(`[aria-label="Search ${props.kind}s"]`)?.focus();
});
</script>

<template>
  <UContainer class="py-10 sm:py-12 lg:py-14">
    <header class="grid gap-7 pb-8 lg:grid-cols-12 lg:items-end">
      <div class="lg:col-span-8">
        <p class="text-toned flex items-center gap-2 text-sm">
          <UIcon
            :name="kind === 'tool' ? 'i-tabler-tools' : 'i-tabler-device-gamepad-2'"
            class="size-4"
            aria-hidden="true"
          />
          {{ kind === "tool" ? "Browser tools" : "Browser games" }}
        </p>
        <h1
          class="text-highlighted mt-4 max-w-4xl text-4xl leading-[0.98] font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-6xl"
        >
          {{ title }}
        </h1>
        <p class="text-muted mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {{ description }}
        </p>
      </div>
      <div class="lg:col-span-4 lg:text-right">
        <p class="text-toned font-mono text-sm tabular-nums">
          {{ items.length }} {{ kind === "tool" ? "tools" : "games" }}
        </p>
      </div>
    </header>

    <template v-if="kind === 'tool'">
      <div class="mt-8 grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
        <aside>
          <div class="lg:sticky lg:top-20">
            <UFormField
              label="Category"
              class="lg:hidden"
            >
              <USelect
                v-model="selectedCategory"
                :items="categoryOptions"
                value-key="value"
                label-key="label"
                class="!bg-elevated w-full"
              />
            </UFormField>

            <nav
              class="hidden lg:grid lg:gap-1"
              aria-label="Tool categories"
            >
              <button
                v-for="category in categoryOptions"
                :key="category.value"
                type="button"
                class="focus-visible:outline-primary grid min-h-9 grid-cols-[1fr_auto] items-center gap-3 rounded-md px-3 text-left text-sm transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2"
                :class="
                  selectedCategory === category.value
                    ? 'bg-elevated text-highlighted font-medium'
                    : 'text-muted hover:bg-elevated/70 hover:text-highlighted'
                "
                :aria-pressed="selectedCategory === category.value"
                @click="selectedCategory = category.value"
              >
                <span>{{ category.label }}</span>
                <span class="text-dimmed font-mono text-xs tabular-nums">{{ category.count }}</span>
              </button>
            </nav>

            <div class="border-muted mt-6 hidden border-t pt-5 lg:block">
              <p class="text-muted text-xs leading-5">
                Press <UKbd value="/" /> anywhere on this page to search.
              </p>
            </div>
          </div>
        </aside>

        <div class="min-w-0">
          <div class="bg-default sticky top-16 z-20 -mx-1 px-1 pb-5">
            <div class="flex items-center gap-3">
              <UInput
                v-model="search"
                :placeholder="searchPlaceholder"
                icon="i-tabler-search"
                size="xl"
                aria-label="Search tools"
                class="w-full"
              >
                <template #trailing>
                  <UKbd
                    value="/"
                    class="hidden sm:inline-flex"
                  />
                </template>
              </UInput>
              <UButton
                v-if="search || selectedCategory !== 'all'"
                label="Clear"
                color="neutral"
                variant="ghost"
                @click="clearFilters"
              />
            </div>
            <p
              class="text-dimmed mt-2 text-sm"
              aria-live="polite"
            >
              {{ filteredItems.length }} {{ filteredItems.length === 1 ? "result" : "results" }}
            </p>
          </div>

          <section
            v-if="recentItems.length && !search && selectedCategory === 'all'"
            aria-labelledby="recent-tools-heading"
            class="mb-9"
          >
            <div class="mb-3 flex items-center justify-between gap-4">
              <h2
                id="recent-tools-heading"
                class="text-highlighted text-base font-semibold"
              >
                Recently opened
              </h2>
              <button
                type="button"
                class="text-muted hover:text-highlighted focus-visible:outline-primary rounded-sm text-xs focus-visible:outline-2"
                @click="recentPaths = []"
              >
                Clear history
              </button>
            </div>
            <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <NuxtLink
                v-for="item in recentItems"
                :key="item.id"
                :to="item.path"
                class="bg-elevated focus-visible:outline-primary hover:bg-muted/45 flex min-h-20 items-center gap-3 rounded-md px-4 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2"
                @click="remember(item)"
              >
                <UIcon
                  :name="item.icon || 'i-tabler-tools'"
                  class="text-toned size-5 shrink-0"
                  aria-hidden="true"
                />
                <span class="text-highlighted line-clamp-2 text-sm font-medium">{{
                  item.title
                }}</span>
              </NuxtLink>
            </div>
          </section>

          <template v-if="filteredItems.length">
            <section
              v-for="[category, entries] in toolGroups"
              :key="category"
              :aria-labelledby="`tool-group-${category.replaceAll(' ', '-').toLowerCase()}`"
              class="mb-9 last:mb-0"
            >
              <header class="mb-3 flex items-center justify-between gap-4">
                <h2
                  :id="`tool-group-${category.replaceAll(' ', '-').toLowerCase()}`"
                  class="text-highlighted text-lg font-semibold tracking-tight"
                >
                  {{ category === "Developer" ? "Developer Tools" : category }}
                </h2>
                <span class="text-dimmed font-mono text-xs tabular-nums">{{ entries.length }}</span>
              </header>

              <div
                class="bg-elevated grid overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--ui-border-muted)] md:grid-cols-2"
              >
                <NuxtLink
                  v-for="item in entries"
                  :key="item.id"
                  :to="item.path"
                  class="group border-muted bg-elevated focus-visible:outline-primary hover:bg-muted/40 grid min-h-[5.5rem] grid-cols-[auto_1fr_auto] items-center gap-3 border-b p-4 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] md:odd:border-r"
                  @click="remember(item)"
                >
                  <span
                    class="bg-muted text-toned flex size-9 items-center justify-center rounded-md"
                  >
                    <UIcon
                      :name="item.icon || 'i-tabler-tools'"
                      class="size-[1.125rem]"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="min-w-0">
                    <span class="text-highlighted block truncate text-sm font-semibold">{{
                      item.title
                    }}</span>
                    <span class="text-muted mt-1 block truncate text-xs">{{
                      item.description
                    }}</span>
                  </span>
                  <UIcon
                    name="i-tabler-arrow-up-right"
                    class="text-dimmed size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </NuxtLink>
              </div>
            </section>
          </template>
        </div>
      </div>
    </template>

    <template v-else>
      <section
        v-if="showFeaturedGames && featuredGames.length"
        class="mt-9"
        aria-labelledby="featured-games-heading"
      >
        <div class="mb-4 flex items-end justify-between gap-6">
          <div>
            <h2
              id="featured-games-heading"
              class="text-highlighted text-xl font-semibold tracking-tight"
            >
              Start here
            </h2>
            <p class="text-muted mt-1 text-sm">
              Three games with distinct controls and play styles.
            </p>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-12">
          <NuxtLink
            v-for="(item, index) in featuredGames"
            :key="item.id"
            :to="item.path"
            :aria-label="`Play ${item.title}`"
            class="group bg-elevated focus-visible:outline-primary overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--ui-border-muted)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_var(--ui-border),0_18px_45px_rgb(0_0_0/0.12)] focus-visible:outline-2 focus-visible:outline-offset-2"
            :class="index === 0 ? 'lg:col-span-6' : 'lg:col-span-3'"
            @click="remember(item)"
          >
            <article class="flex h-full min-h-72 flex-col">
              <GamePreview
                :path="item.path"
                :title="item.title"
                :category="item.category"
                :icon="item.icon"
                featured
                class="min-h-44 flex-1"
              />
              <div class="flex items-end justify-between gap-4 p-5">
                <div class="min-w-0">
                  <h3 class="text-highlighted text-xl font-semibold tracking-tight">
                    {{ item.title }}
                  </h3>
                  <p
                    v-if="index === 0"
                    class="text-muted mt-2 line-clamp-2 text-sm leading-5"
                  >
                    {{ item.description }}
                  </p>
                </div>
                <UIcon
                  name="i-tabler-arrow-up-right"
                  class="text-dimmed size-5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </div>
            </article>
          </NuxtLink>
        </div>
      </section>

      <section
        aria-label="Game filters"
        class="bg-muted/45 mt-8 rounded-lg p-4 sm:p-5"
      >
        <div class="grid gap-4 lg:grid-cols-[minmax(18rem,32rem)_minmax(0,1fr)] lg:items-center">
          <UInput
            v-model="search"
            :placeholder="searchPlaceholder"
            icon="i-tabler-search"
            size="xl"
            aria-label="Search games"
            class="!bg-elevated w-full"
          >
            <template #trailing>
              <UKbd
                value="/"
                class="hidden sm:inline-flex"
              />
            </template>
          </UInput>

          <div class="flex gap-1 overflow-x-auto lg:justify-end">
            <UButton
              v-for="category in categoryOptions"
              :key="category.value"
              :label="category.label"
              color="neutral"
              :variant="selectedCategory === category.value ? 'soft' : 'ghost'"
              size="sm"
              :aria-pressed="selectedCategory === category.value"
              class="shrink-0"
              @click="selectedCategory = category.value"
            />
          </div>
        </div>
        <p
          class="text-dimmed mt-3 text-sm"
          aria-live="polite"
        >
          {{ filteredItems.length }} {{ filteredItems.length === 1 ? "result" : "results" }}
        </p>
      </section>

      <div
        v-if="visibleGames.length"
        class="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <NuxtLink
          v-for="item in visibleGames"
          :key="item.id"
          :to="item.path"
          :aria-label="`Play ${item.title}`"
          class="group bg-elevated focus-visible:outline-primary overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--ui-border-muted)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_var(--ui-border),0_16px_38px_rgb(0_0_0/0.1)] focus-visible:outline-2 focus-visible:outline-offset-2"
          @click="remember(item)"
        >
          <article>
            <div class="relative aspect-[4/3]">
              <GamePreview
                :path="item.path"
                :title="item.title"
                :category="item.category"
                :icon="item.icon"
              />
              <UIcon
                name="i-tabler-arrow-up-right"
                class="absolute top-3 right-3 size-4 text-white/65 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </div>
            <div class="p-4">
              <h2 class="text-highlighted truncate text-base font-semibold">{{ item.title }}</h2>
              <p class="text-muted mt-1.5 line-clamp-2 text-sm leading-5">{{ item.description }}</p>
            </div>
          </article>
        </NuxtLink>
      </div>
    </template>

    <UEmpty
      v-if="!filteredItems.length"
      icon="i-tabler-search-off"
      title="No matching items"
      description="Try another term or show every category."
      class="border-muted bg-elevated mt-8 rounded-lg border py-16"
    >
      <template #actions>
        <UButton
          label="Clear filters"
          color="neutral"
          variant="outline"
          @click="clearFilters"
        />
      </template>
    </UEmpty>
  </UContainer>
</template>
