<script setup lang="ts">
const [{ data: tools }, { data: games }] = await Promise.all([
  useAsyncData("home_tools", () => queryCollection("tools").all()),
  useAsyncData("home_games", () => queryCollection("games").all()),
]);

const featuredPaths = [
  "/tools/developer/json-formatter",
  "/tools/text/word-char-counter",
  "/tools/encoder-decoder/base64",
  "/tools/developer/uuid-generator",
  "/tools/text/slug-generator",
];
const featureSpans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-5",
  "lg:col-span-3",
];
const gameSpans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

const featuredTools = computed(() => {
  const byPath = new Map((tools.value ?? []).map((tool) => [tool.path, tool]));
  return featuredPaths
    .map((path) => byPath.get(path))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
});

const quickLaunchTools = computed(() => featuredTools.value.slice(0, 4));

const featuredGames = computed(() =>
  (games.value ?? []).toSorted((a, b) => a.title.localeCompare(b.title)),
);

const categories = computed(() => {
  const counts = new Map<string, number>();
  for (const tool of tools.value ?? []) {
    counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({
      name,
      count,
      label: name === "Developer" ? "Developer Tools" : name,
      description: {
        Developer: "Format structured data and generate identifiers.",
        "Encoder Decoder": "Translate Base64, binary, Morse code, and URLs.",
        Text: "Count, clean, sort, and reshape plain text.",
      }[name],
    }));
});

useSeoMeta({
  title: "Free browser tools for text and data",
  description:
    "Format JSON, clean text, encode data, generate IDs, and play quick puzzles in your browser. No signup or installation.",
});
</script>

<template>
  <HomeMotion>
    <section class="border-default/70 border-b">
      <UContainer class="grid min-h-[calc(78dvh-4rem)] lg:grid-cols-12">
        <div
          class="border-default/70 flex flex-col justify-center border-b py-16 sm:py-20 lg:col-span-8 lg:border-r lg:border-b-0 lg:py-24 lg:pr-16 xl:pr-24"
        >
          <p class="hero-reveal text-toned font-mono text-xs">
            {{ tools?.length ?? 0 }} tools / {{ games?.length ?? 0 }} games / no signup
          </p>
          <h1
            class="hero-reveal text-highlighted mt-8 max-w-5xl text-[clamp(3.5rem,7vw,7.25rem)] leading-[0.88] font-semibold tracking-[-0.065em]"
          >
            <span class="block">Small tools.</span>
            <span class="block">Clear results.</span>
          </h1>
          <p class="hero-reveal text-muted mt-8 max-w-xl text-lg leading-8 sm:text-xl">
            Format, convert, clean, generate, or play. No account, upload, or setup.
          </p>
          <div class="hero-reveal mt-10 flex flex-wrap items-center gap-3">
            <UButton
              label="Explore tools"
              to="/tools"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
            />
            <UButton
              label="Play a game"
              to="/games"
              color="neutral"
              variant="outline"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>
        </div>

        <aside
          class="hero-reveal flex flex-col justify-center py-12 lg:col-span-4 lg:py-16 lg:pl-10"
        >
          <div class="flex items-end justify-between gap-4">
            <h2 class="text-highlighted text-lg font-semibold">Open something useful</h2>
            <span class="text-toned font-mono text-xs">Quick launch</span>
          </div>
          <nav
            class="border-default/70 mt-5 border-t"
            aria-label="Quick launch"
          >
            <NuxtLink
              v-for="(tool, index) in quickLaunchTools"
              :key="tool.id"
              :to="tool.path"
              class="group border-default/70 focus-visible:ring-primary hover:bg-elevated/35 grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b px-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span class="text-toned font-mono text-xs tabular-nums">
                {{ String(index + 1).padStart(2, "0") }}
              </span>
              <span>
                <span class="text-highlighted block text-sm font-semibold">{{ tool.title }}</span>
                <span class="text-muted mt-0.5 block text-xs">{{ tool.category }}</span>
              </span>
              <UIcon
                name="i-lucide-arrow-right"
                class="text-dimmed size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </NuxtLink>
          </nav>
        </aside>
      </UContainer>
    </section>

    <section class="home-reveal py-20 sm:py-24">
      <UContainer class="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div class="lg:col-span-4">
          <p class="text-toned font-mono text-xs">Tool directory</p>
          <h2
            class="text-highlighted mt-5 max-w-md text-4xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-5xl"
          >
            Tools, grouped by the job.
          </h2>
          <p class="text-muted mt-6 max-w-sm leading-7">
            Start with the kind of input you have. Each tool opens directly to its workbench.
          </p>
        </div>

        <nav
          class="border-default/70 border-t lg:col-span-8"
          aria-label="Tool categories"
        >
          <NuxtLink
            v-for="category in categories"
            :key="category.name"
            :to="{ path: '/tools', query: { category: category.name } }"
            class="group border-default/70 focus-visible:ring-primary hover:bg-elevated/35 grid min-h-28 gap-5 border-b px-1 py-6 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[minmax(0,1fr)_minmax(16rem,1fr)_auto] sm:items-center"
          >
            <span class="text-highlighted text-xl font-semibold">{{ category.label }}</span>
            <span class="text-muted text-sm leading-6">{{ category.description }}</span>
            <span class="text-toned flex items-center gap-4 font-mono text-xs tabular-nums">
              {{ category.count }}
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </NuxtLink>
        </nav>
      </UContainer>
    </section>

    <section class="home-reveal border-default/70 bg-muted/20 border-y py-20 sm:py-24">
      <UContainer>
        <div class="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-8">
            <p class="text-toned font-mono text-xs">Frequently useful</p>
            <h2
              class="text-highlighted mt-5 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl"
            >
              Go straight to the workbench.
            </h2>
          </div>
          <div class="lg:col-span-4 lg:justify-self-end">
            <UButton
              label="See every tool"
              to="/tools"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>
        </div>

        <div class="border-default/70 mt-12 grid grid-flow-dense border-t border-l lg:grid-cols-12">
          <NuxtLink
            v-for="(tool, index) in featuredTools"
            :key="tool.id"
            :to="tool.path"
            class="group border-default/70 focus-visible:ring-primary bg-default hover:bg-elevated/40 min-h-52 border-r border-b p-6 transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none sm:p-8"
            :class="featureSpans[index]"
          >
            <article class="flex h-full flex-col">
              <div class="flex items-start justify-between gap-8">
                <span class="text-toned font-mono text-xs">
                  {{ tool.category === "Developer" ? "Developer Tools" : tool.category }}
                </span>
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="text-dimmed group-hover:text-highlighted size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
              <div class="mt-auto pt-12">
                <UIcon
                  :name="tool.icon || 'i-lucide-wrench'"
                  class="text-primary mb-5 size-6"
                />
                <h3 class="text-highlighted text-2xl font-semibold tracking-tight">
                  {{ tool.title }}
                </h3>
                <p class="text-muted mt-3 max-w-xl text-sm leading-6">
                  {{ tool.description }}
                </p>
              </div>
            </article>
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <section
      v-if="featuredGames.length"
      class="home-reveal py-20 sm:py-24"
    >
      <UContainer>
        <div class="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-8">
            <p class="text-toned font-mono text-xs">Games</p>
            <h2
              class="text-highlighted mt-5 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl"
            >
              Take a break without making an account.
            </h2>
          </div>
          <p class="text-muted max-w-md leading-7 lg:col-span-4 lg:justify-self-end">
            Word, number, logic, and strategy games that begin as soon as the page opens.
          </p>
        </div>

        <div class="border-default/70 mt-12 grid border-t border-l lg:grid-cols-12">
          <NuxtLink
            v-for="(game, index) in featuredGames"
            :key="game.id"
            :to="game.path"
            class="group border-default/70 focus-visible:ring-primary hover:bg-elevated/35 min-h-60 border-r border-b p-6 transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none sm:p-8"
            :class="gameSpans[index]"
          >
            <article class="flex h-full flex-col">
              <div class="flex items-start justify-between gap-6">
                <span class="text-toned font-mono text-xs">{{ game.category }}</span>
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="text-dimmed group-hover:text-highlighted size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
              <div class="mt-auto pt-12">
                <UIcon
                  :name="game.icon || 'i-lucide-gamepad-2'"
                  class="text-primary mb-5 size-7"
                />
                <h3 class="text-highlighted text-3xl font-semibold tracking-tight">
                  {{ game.title }}
                </h3>
                <p class="text-muted mt-3 max-w-xl text-sm leading-6">{{ game.description }}</p>
              </div>
            </article>
          </NuxtLink>
        </div>

        <UButton
          label="Open all games"
          to="/games"
          color="neutral"
          variant="link"
          trailing-icon="i-lucide-arrow-right"
          class="mt-6 px-0"
        />
      </UContainer>
    </section>

    <section class="home-reveal border-default/70 border-t py-20 sm:py-24">
      <UContainer class="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div class="lg:col-span-8">
          <p class="text-toned font-mono text-xs">Local by default</p>
          <h2
            class="text-highlighted mt-5 max-w-4xl text-4xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl"
          >
            Your input stays in this browser.
          </h2>
          <p class="text-muted mt-6 max-w-2xl text-lg leading-8">
            Current tools process text and data on this page. Nothing is sent to an Instruo server.
          </p>
        </div>
        <div class="lg:col-span-4 lg:justify-self-end">
          <UButton
            label="View the source"
            to="https://github.com/rahulv-official/instruo"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-github"
            size="xl"
          />
        </div>
      </UContainer>
    </section>
  </HomeMotion>
</template>
