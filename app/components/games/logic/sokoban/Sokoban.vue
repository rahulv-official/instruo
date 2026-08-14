<script setup lang="ts">
import type { SokobanGameState } from "./createSokobanGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createSokobanGame } from "./createSokobanGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<SokobanGameState>({
  status: "ready",
  level: 1,
  totalLevels: 50,
  moves: 0,
  pushes: 0,
  completedLevels: 0,
  won: false,
});

const resultTitle = computed(() => (state.value.won ? "Warehouse cleared" : "Route paused"));
const resultCopy = computed(() =>
  state.value.won
    ? "Every crate reached its goal. Clean route."
    : "The run ended before every delivery was complete.",
);

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.level === "number" &&
    typeof next.totalLevels === "number" &&
    typeof next.moves === "number" &&
    typeof next.pushes === "number" &&
    typeof next.completedLevels === "number" &&
    typeof next.won === "boolean"
  ) {
    state.value = {
      status: next.status,
      level: next.level,
      totalLevels: next.totalLevels,
      moves: next.moves,
      pushes: next.pushes,
      completedLevels: next.completedLevels,
      won: next.won,
    };
  }
}
</script>

<template>
  <ToolWorkbench description="Push every crate onto a goal using the fewest moves. Seeded warehouse layouts stay solvable and run entirely in your browser.">
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Sokoban</p>
          <p class="text-muted mt-1 font-mono text-xs">Warehouse Run · local puzzle</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span>Level <strong class="text-highlighted">{{ state.level }}/{{ state.totalLevels }}</strong></span>
          <span><strong class="text-highlighted">{{ state.pushes }}</strong> pushes</span>
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #14211f"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createSokobanGame"
          label="Sokoban game stage"
          loading-title="LOADING WAREHOUSE RUN"
          loading-copy="Mapping the delivery routes…"
          loading-background="#14211f"
          :class="{ 'blur-sm': loaded && state.status === 'over' }"
          @state="updateState"
          @ready="loaded = true"
          @error="gameError = true"
        />

        <PhaserFullscreenButton
          :is-fullscreen="gameHost?.isFullscreen ?? false"
          @toggle="gameHost?.toggleFullscreen()"
        />

        <div
          v-if="loaded && state.status === 'ready'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
        >
          <div class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl">
            <div class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl" aria-hidden="true">
              <Icon name="tabler:box" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Plan the route</h2>
            <p class="text-muted text-sm leading-6">
              Level one is an open-room warm-up. New shelves and crates arrive as the route gets tougher. Use undo when a plan closes.
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
                Start route
              </span>
            </button>
            <p class="text-muted font-mono text-xs">Arrows / WASD · Z undo · R reset · swipe</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sokoban-over-title"
        >
          <div class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl">
            <div
              class="mx-auto grid size-14 place-items-center text-2xl text-inverted"
              :class="state.won ? 'bg-success' : 'bg-error'"
              aria-hidden="true"
            >
              <Icon :name="state.won ? 'tabler:trophy' : 'tabler:alert-triangle'" />
            </div>
            <h2 id="sokoban-over-title" class="text-highlighted text-xl font-semibold">{{ resultTitle }}</h2>
            <p class="text-muted text-sm leading-6">{{ resultCopy }}</p>
            <p class="text-highlighted font-mono text-4xl font-bold tabular-nums">{{ state.pushes }} pushes</p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">
              {{ state.completedLevels }}/{{ state.totalLevels }} levels complete · {{ state.moves }} moves
            </p>
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
                Try again
              </span>
            </button>
          </div>
        </div>

        <div v-if="gameError" class="bg-default absolute inset-0 z-20 grid place-items-center p-5" role="alert">
          <UAlert
            color="error"
            variant="subtle"
            title="Game unavailable"
            description="Reload the page and try once more."
            icon="tabler:alert-triangle"
          />
        </div>
      </div>

      <p class="text-muted text-center font-mono text-xs">
        {{ state.moves }} moves · {{ state.pushes }} pushes · no account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
