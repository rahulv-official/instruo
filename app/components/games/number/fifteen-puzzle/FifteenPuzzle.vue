<script setup lang="ts">
import type { FifteenPuzzleGameState } from "./createFifteenPuzzleGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createFifteenPuzzleGame } from "./createFifteenPuzzleGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<FifteenPuzzleGameState>({
  status: "ready",
  moves: 0,
  elapsedSeconds: 0,
  bestMoves: 0,
});

const formattedTime = computed(() => {
  const minutes = Math.floor(state.value.elapsedSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(state.value.elapsedSeconds % 60).padStart(2, "0")}`;
});

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "won") &&
    typeof next.moves === "number" &&
    typeof next.elapsedSeconds === "number" &&
    typeof next.bestMoves === "number"
  ) {
    state.value = {
      status: next.status,
      moves: next.moves,
      elapsedSeconds: next.elapsedSeconds,
      bestMoves: next.bestMoves,
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="Slide every numbered tile into order. Boards are shuffled through legal moves, so every run is solvable."
  >
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Fifteen Puzzle</p>
          <p class="text-muted mt-1 font-mono text-xs">Sliding Atelier · local puzzle run</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span class="text-highlighted">{{ state.moves }} moves</span>
          <span class="text-highlighted">{{ formattedTime }}</span>
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #151a21"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createFifteenPuzzleGame"
          label="Fifteen Puzzle game stage"
          loading-title="LOADING SLIDING ATELIER"
          loading-copy="Laying out a solvable board…"
          loading-background="#151a21"
          :class="{ 'blur-sm': loaded && state.status === 'won' }"
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
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="tabler:grid-4x4" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Set the tiles free</h2>
            <p class="text-muted text-sm leading-6">
              Slide tiles beside the empty square until 1–15 read in order. Every board is built
              from legal moves.
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
                <Icon
                  name="tabler:player-play-filled"
                  aria-hidden="true"
                />
                Start puzzle
              </span>
            </button>
            <p class="text-muted font-mono text-xs">Tap a tile · arrows / WASD · Enter or Space</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'won'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fifteen-puzzle-won-title"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-success text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="tabler:confetti" />
            </div>
            <h2
              id="fifteen-puzzle-won-title"
              class="text-highlighted text-xl font-semibold"
            >
              Order restored
            </h2>
            <p class="text-highlighted font-mono text-5xl font-bold tabular-nums">
              {{ state.moves }}
            </p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">
              moves · {{ formattedTime }} · best {{ state.bestMoves || "—" }}
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
                <Icon
                  name="tabler:refresh"
                  aria-hidden="true"
                />
                Play again
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="gameError"
          class="bg-default absolute inset-0 z-20 grid place-items-center p-5"
          role="alert"
        >
          <UAlert
            color="error"
            variant="subtle"
            title="Game unavailable"
            description="Reload the page and try once more."
            icon="i-lucide-circle-alert"
          />
        </div>
      </div>

      <p class="text-muted text-center font-mono text-xs">
        Every puzzle is solvable · no account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
