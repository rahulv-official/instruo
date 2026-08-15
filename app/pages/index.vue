<script setup lang="ts">
const [{ data: tools }, { data: games }] = await Promise.all([
  useAsyncData("home_tools", () =>
    queryCollection("tools")
      .select("id", "path", "title", "description", "category", "tags", "icon")
      .all(),
  ),
  useAsyncData("home_games", () =>
    queryCollection("games")
      .select("id", "path", "title", "description", "category", "tags", "icon")
      .all(),
  ),
]);

const query = ref("");

const featuredToolPaths = [
  "/tools/image/image-resizer",
  "/tools/security/password-generator",
  "/tools/developer/json-formatter",
  "/tools/developer/timestamp-converter",
  "/tools/text/word-char-counter",
];

const featuredGamePaths = ["/games/arcade/flappy-bird", "/games/number/2048", "/games/word/wordle"];

const categoryLinks = [
  { label: "Developer Tools", value: "Developer", icon: "i-tabler-code" },
  { label: "Image", value: "Image", icon: "i-tabler-photo" },
  { label: "Security", value: "Security", icon: "i-tabler-shield-lock" },
  { label: "Text", value: "Text", icon: "i-tabler-cursor-text" },
  { label: "Everyday", value: "Everyday", icon: "i-tabler-calculator" },
  { label: "Productivity", value: "Productivity", icon: "i-tabler-checklist" },
  { label: "Encoder Decoder", value: "Encoder Decoder", icon: "i-tabler-arrows-exchange" },
];

const featuredTools = computed(() => {
  const byPath = new Map((tools.value ?? []).map((tool) => [tool.path, tool]));
  return featuredToolPaths
    .map((path) => byPath.get(path))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
});

const featuredGames = computed(() => {
  const byPath = new Map((games.value ?? []).map((game) => [game.path, game]));
  return featuredGamePaths
    .map((path) => byPath.get(path))
    .filter((game): game is NonNullable<typeof game> => Boolean(game));
});

const matches = computed(() => {
  const normalized = query.value.trim().toLowerCase();
  if (!normalized) return featuredTools.value.slice(0, 5);

  return [...(tools.value ?? []), ...(games.value ?? [])]
    .filter((item) =>
      [item.title, item.description, item.category, ...(item.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
    .toSorted((a, b) => a.title.localeCompare(b.title))
    .slice(0, 6);
});

useSeoMeta({
  title: "Free browser tools and games",
  description:
    "Format data, prepare images, generate secure values, and play polished browser games without creating an account.",
});
</script>

<template>
  <HomeMotion class="instruo-home">
    <section class="border-muted border-b">
      <UContainer
        class="grid min-h-[38rem] items-center gap-12 py-14 sm:py-18 lg:grid-cols-12 lg:gap-16 lg:py-20"
      >
        <div class="lg:col-span-7">
          <p class="hero-reveal text-toned font-mono text-xs tabular-nums">
            {{ tools?.length ?? 0 }} tools · {{ games?.length ?? 0 }} games · no account
          </p>
          <h1
            class="hero-reveal text-highlighted mt-6 max-w-4xl text-[clamp(3.25rem,5.5vw,4.75rem)] leading-[0.94] font-semibold tracking-[-0.055em] text-balance"
          >
            Tools for the task.<br />Games for the break.
          </h1>
          <p class="hero-reveal text-muted mt-7 max-w-xl text-lg leading-8 sm:text-xl">
            Format, convert, calculate, or play. Everything opens in this browser without setup.
          </p>
          <div class="hero-reveal mt-8 flex flex-wrap gap-3">
            <UButton
              label="Find a tool"
              to="/tools"
              size="xl"
              trailing-icon="i-tabler-arrow-right"
            />
            <UButton
              label="Choose a game"
              to="/games"
              color="neutral"
              variant="outline"
              size="xl"
              trailing-icon="i-tabler-arrow-right"
            />
          </div>
        </div>

        <section
          class="hero-reveal bg-elevated overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--ui-border-muted),0_24px_80px_rgb(0_0_0/0.14)] lg:col-span-5"
          aria-labelledby="launcher-heading"
        >
          <header class="border-muted border-b px-5 py-4 sm:px-6">
            <div class="flex items-center justify-between gap-4">
              <h2
                id="launcher-heading"
                class="text-highlighted text-sm font-semibold"
              >
                Open something
              </h2>
              <span class="text-dimmed font-mono text-xs">Tools + games</span>
            </div>
            <UInput
              v-model="query"
              icon="i-tabler-search"
              size="xl"
              placeholder="What are you trying to do?"
              aria-label="Search tools and games"
              class="mt-4 w-full"
            />
          </header>

          <nav
            class="p-2"
            aria-label="Quick launcher results"
          >
            <NuxtLink
              v-for="match in matches"
              :key="match.id"
              :to="match.path"
              class="group focus-visible:outline-primary hover:bg-accented/65 grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-3 py-2 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2"
            >
              <span class="bg-muted text-toned flex size-9 items-center justify-center rounded-md">
                <UIcon
                  :name="match.icon || 'i-tabler-tools'"
                  class="size-5"
                  aria-hidden="true"
                />
              </span>
              <span class="min-w-0">
                <span class="text-highlighted block truncate text-sm font-medium">
                  {{ match.title }}
                </span>
                <span class="text-dimmed block truncate text-xs">{{ match.category }}</span>
              </span>
              <UIcon
                name="i-tabler-arrow-up-right"
                class="text-dimmed size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </NuxtLink>

            <p
              v-if="!matches.length"
              class="text-muted px-4 py-10 text-center text-sm"
            >
              No match. Try “crop image,” “JSON,” or “Sudoku.”
            </p>
          </nav>
        </section>
      </UContainer>
    </section>

    <section class="home-reveal py-18 sm:py-22 lg:py-26">
      <UContainer>
        <div class="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-7">
            <h2 class="text-highlighted text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Start with a useful one.
            </h2>
            <p class="text-muted mt-4 max-w-2xl leading-7">
              Five dependable tools, selected for common tasks. The full directory stays one click
              away.
            </p>
          </div>
          <div class="lg:col-span-5 lg:text-right">
            <UButton
              label="Browse all tools"
              to="/tools"
              color="neutral"
              variant="outline"
              trailing-icon="i-tabler-arrow-right"
            />
          </div>
        </div>

        <div
          v-if="featuredTools.length"
          class="bg-elevated mt-9 grid overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--ui-border-muted)] lg:grid-cols-[1.1fr_0.9fr]"
        >
          <NuxtLink
            :to="featuredTools[0]?.path"
            class="group border-muted focus-visible:outline-primary hover:bg-accented/45 flex min-h-72 flex-col border-b p-6 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:p-8 lg:border-r lg:border-b-0"
          >
            <div class="flex items-start justify-between gap-5">
              <span class="bg-muted text-toned flex size-11 items-center justify-center rounded-md">
                <UIcon
                  :name="featuredTools[0]?.icon || 'i-tabler-tools'"
                  class="size-6"
                  aria-hidden="true"
                />
              </span>
              <UIcon
                name="i-tabler-arrow-up-right"
                class="text-dimmed size-5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </div>
            <div class="mt-auto pt-12">
              <p class="text-dimmed text-sm">{{ featuredTools[0]?.category }}</p>
              <h3 class="text-highlighted mt-2 text-3xl font-semibold tracking-[-0.035em]">
                {{ featuredTools[0]?.title }}
              </h3>
              <p class="text-muted mt-3 max-w-xl leading-7">{{ featuredTools[0]?.description }}</p>
            </div>
          </NuxtLink>

          <nav aria-label="Popular tools">
            <NuxtLink
              v-for="tool in featuredTools.slice(1)"
              :key="tool.id"
              :to="tool.path"
              class="group border-muted focus-visible:outline-primary hover:bg-accented/45 grid min-h-[4.75rem] grid-cols-[auto_1fr_auto] items-center gap-4 border-b px-5 py-3 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:px-6"
            >
              <UIcon
                :name="tool.icon || 'i-tabler-tools'"
                class="text-toned size-5"
                aria-hidden="true"
              />
              <span class="min-w-0">
                <span class="text-highlighted block truncate text-sm font-semibold">{{
                  tool.title
                }}</span>
                <span class="text-muted mt-0.5 block truncate text-xs">{{ tool.description }}</span>
              </span>
              <UIcon
                name="i-tabler-arrow-right"
                class="text-dimmed size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </NuxtLink>
          </nav>
        </div>

        <nav
          class="bg-elevated/30 mt-5 grid overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--ui-border-muted)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          aria-label="Tool categories"
        >
          <NuxtLink
            v-for="category in categoryLinks"
            :key="category.value"
            :to="{ path: '/tools', query: { category: category.value } }"
            class="group border-muted bg-default focus-visible:outline-primary hover:bg-elevated flex min-h-14 items-center gap-2.5 border-r border-b px-4 text-sm font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
          >
            <UIcon
              :name="category.icon"
              class="text-toned size-4"
              aria-hidden="true"
            />
            <span class="text-highlighted truncate">{{ category.label }}</span>
          </NuxtLink>
        </nav>
      </UContainer>
    </section>

    <section class="home-reveal border-muted bg-muted/60 border-y py-18 sm:py-22 lg:py-26">
      <UContainer>
        <div class="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-7">
            <h2 class="text-highlighted text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Take the better kind of break.
            </h2>
            <p class="text-muted mt-4 max-w-2xl leading-7">
              Keyboard and touch-ready games with their own mechanics, sound, and visual identity.
            </p>
          </div>
          <div class="lg:col-span-5 lg:text-right">
            <UButton
              label="See all games"
              to="/games"
              color="neutral"
              variant="outline"
              trailing-icon="i-tabler-arrow-right"
            />
          </div>
        </div>

        <div class="mt-9 grid gap-4 lg:grid-cols-12">
          <NuxtLink
            v-for="(game, index) in featuredGames"
            :key="game.id"
            :to="game.path"
            :aria-label="`Play ${game.title}`"
            class="game-feature group bg-elevated focus-visible:outline-primary overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--ui-border-muted)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2"
            :class="index === 0 ? 'lg:col-span-6' : 'lg:col-span-3'"
          >
            <article class="flex h-full min-h-72 flex-col">
              <GamePreview
                :path="game.path"
                :title="game.title"
                :category="game.category"
                :icon="game.icon"
                featured
                class="min-h-44 flex-1"
              />
              <div class="flex items-end justify-between gap-5 p-5 sm:p-6">
                <div class="min-w-0">
                  <h3 class="text-highlighted text-xl font-semibold tracking-tight">
                    {{ game.title }}
                  </h3>
                  <p
                    v-if="index === 0"
                    class="text-muted mt-2 line-clamp-2 text-sm leading-5"
                  >
                    {{ game.description }}
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
      </UContainer>
    </section>

    <section class="home-reveal py-16 sm:py-20">
      <UContainer class="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div class="lg:col-span-8">
          <h2 class="text-highlighted text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Nothing to install. Nothing to sign into.
          </h2>
          <p class="text-muted mt-3 max-w-2xl leading-7">
            Current tools process their input on this page. Inspect the source if you want to verify
            how one works.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
          <UButton
            label="Browse tools"
            to="/tools"
            trailing-icon="i-tabler-arrow-right"
          />
          <UButton
            label="View source"
            to="https://github.com/rahulv-official/instruo"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
            icon="i-tabler-brand-github"
          />
        </div>
      </UContainer>
    </section>
  </HomeMotion>
</template>
