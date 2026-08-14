<script setup lang="ts">
import type { MazeChaseGameState } from "./createMazeChaseGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createMazeChaseGame } from "./createMazeChaseGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const soundMuted = ref(false);
const state = shallowRef<MazeChaseGameState>({
  status: "ready",
  score: 0,
  best: 0,
  lives: 3,
  level: 1,
  pellets: 0,
  totalPellets: 0,
  powered: false,
  won: false,
});

const resultTitle = computed(() => (state.value.won ? "Arcade cleared" : "The maze got you"));
const resultCopy = computed(() =>
  state.value.won
    ? "Ten neon mazes cleared. That route belongs to you."
    : "The ghosts caught the route. Learn the turns and run it back.",
);
const progressCopy = computed(() =>
  state.value.powered
    ? "POWER MODE · ghosts are vulnerable"
    : `${state.value.pellets} pellets remain · ${state.value.lives} lives left`,
);

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.score === "number" &&
    typeof next.best === "number" &&
    typeof next.lives === "number" &&
    typeof next.level === "number" &&
    typeof next.pellets === "number" &&
    typeof next.totalPellets === "number" &&
    typeof next.powered === "boolean" &&
    typeof next.won === "boolean"
  ) {
    state.value = {
      status: next.status,
      score: next.score,
      best: next.best,
      lives: next.lives,
      level: next.level,
      pellets: next.pellets,
      totalPellets: next.totalPellets,
      powered: next.powered,
      won: next.won,
    };
  }
}

function toggleSound() {
  soundMuted.value = !soundMuted.value;
  gameHost.value?.toggleMute();
}
</script>

<template>
  <ToolWorkbench description="Clear seeded neon mazes, eat power pellets, and outrun the ghosts. No account needed.">
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Maze Chase</p>
          <p class="text-muted mt-1 font-mono text-xs">Neon Arcade · ten seeded mazes</p>
        </div>
        <div class="text-muted flex items-center gap-3 font-mono text-xs">
          <button
            v-if="loaded"
            type="button"
            class="text-muted hover:text-highlighted focus-visible:ring-primary grid size-9 place-items-center border border-default transition-colors focus-visible:ring-2 focus-visible:outline-none"
            :aria-pressed="soundMuted"
            :aria-label="soundMuted ? 'Turn sound on' : 'Mute sound'"
            @click="toggleSound"
          >
            <Icon :name="soundMuted ? 'tabler:volume-off' : 'tabler:volume'" aria-hidden="true" />
          </button>
          <span>Level <strong class="text-highlighted">{{ state.level }}/10</strong></span>
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #080b22"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createMazeChaseGame"
          label="Maze Chase game stage"
          loading-title="LOADING NEON ARCADE"
          loading-copy="Drawing the maze and waking the ghosts…"
          loading-background="#080b22"
          :class="{ 'blur-sm': loaded && state.status === 'over' }"
          @state="updateState"
          @ready="loaded = true"
          @error="gameError = true"
        />

        <PhaserFullscreenButton
          :is-fullscreen="gameHost?.isFullscreen ?? false"
          @toggle="gameHost?.toggleFullscreen()"
        />

        <div v-if="loaded && state.status === 'ready'" class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5">
          <div class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl">
            <div class="mx-auto grid size-14 place-items-center bg-primary text-2xl text-inverted" aria-hidden="true">
              <Icon name="tabler:ghost-2" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Enter the maze</h2>
            <p class="text-muted text-sm leading-6">
              Clear every pellet, grab a power pellet, and turn the chase around while the ghosts are blue.
            </p>
            <button
              type="button"
              class="text-inverted focus-visible:ring-primary relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold transition-transform focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
              @click.stop="gameHost?.start()"
            >
              <NuxtImg
                src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 size-full"
                width="232"
                height="70"
              />
              <span class="relative inline-flex items-center gap-2">
                <Icon name="tabler:player-play-filled" aria-hidden="true" />
                Start chase
              </span>
            </button>
            <p class="text-muted font-mono text-xs">Swipe or arrows / WASD · Space starts</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="maze-chase-over-title"
        >
          <div class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl">
            <div
              class="mx-auto grid size-14 place-items-center text-2xl text-inverted"
              :class="state.won ? 'bg-success' : 'bg-error'"
              aria-hidden="true"
            >
              <Icon :name="state.won ? 'tabler:trophy' : 'tabler:ghost-2'" />
            </div>
            <h2 id="maze-chase-over-title" class="text-highlighted text-xl font-semibold">{{ resultTitle }}</h2>
            <p class="text-muted text-sm leading-6">{{ resultCopy }}</p>
            <p class="text-highlighted font-mono text-5xl font-bold tabular-nums">{{ state.score }}</p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">Best {{ state.best }} · Level {{ state.level }}</p>
            <button
              type="button"
              class="text-inverted focus-visible:ring-primary relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold transition-transform focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
              @click.stop="gameHost?.restart()"
            >
              <NuxtImg
                src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 size-full"
                width="232"
                height="70"
              />
              <span class="relative inline-flex items-center gap-2">
                <Icon name="tabler:refresh" aria-hidden="true" />
                Run it back
              </span>
            </button>
          </div>
        </div>

        <div v-if="gameError" class="bg-default absolute inset-0 z-20 grid place-items-center p-5" role="alert">
          <UAlert color="error" variant="subtle" title="Game unavailable" description="Reload the page and try once more." icon="tabler:alert-triangle" />
        </div>
      </div>

      <p class="text-muted text-center font-mono text-xs">{{ progressCopy }} · score {{ state.score }} · no account needed</p>
    </div>
  </ToolWorkbench>
</template>
