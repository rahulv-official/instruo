<script setup lang="ts">
import type { MemoryMatchGameState } from "./createMemoryMatchGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createMemoryMatchGame } from "./createMemoryMatchGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<MemoryMatchGameState>({
  status: "ready",
  moves: 0,
  pairs: 0,
  totalPairs: 8,
  elapsedSeconds: 0,
  won: false,
});

const formattedTime = computed(() => {
  const minutes = Math.floor(state.value.elapsedSeconds / 60);
  const seconds = state.value.elapsedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.moves === "number" &&
    typeof next.pairs === "number" &&
    typeof next.totalPairs === "number" &&
    typeof next.elapsedSeconds === "number" &&
    typeof next.won === "boolean"
  ) {
    state.value = {
      status: next.status,
      moves: next.moves,
      pairs: next.pairs,
      totalPairs: next.totalPairs,
      elapsedSeconds: next.elapsedSeconds,
      won: next.won,
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="Turn over cards, remember their positions, and clear every pair. Everything runs locally in your browser."
  >
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Memory Match</p>
          <p class="text-muted mt-1 font-mono text-xs">Shape Vault · local puzzle run</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span
            ><strong class="text-highlighted">{{ state.pairs }}/{{ state.totalPairs }}</strong>
            pairs</span
          >
          <span
            ><strong class="text-highlighted">{{ formattedTime }}</strong></span
          >
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #181528"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createMemoryMatchGame"
          label="Memory Match game stage"
          loading-title="LOADING CONSTELLATION"
          loading-copy="Shuffling the card faces…"
          loading-background="#181528"
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
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="i-tabler-cards" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Match the shapes</h2>
            <p class="text-muted text-sm leading-6">
              Reveal two cards at a time. Matching shapes lock in with a burst; mismatches turn back
              after a short pause.
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
              <span class="relative inline-flex items-center gap-2"
                ><Icon
                  name="i-tabler-player-play-filled"
                  aria-hidden="true"
                />
                Start game</span
              >
            </button>
            <p class="text-muted font-mono text-xs">Tap cards · arrows + Enter</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-match-over-title"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-success text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="i-tabler-confetti" />
            </div>
            <h2
              id="memory-match-over-title"
              class="text-highlighted text-xl font-semibold"
            >
              Shape vault complete
            </h2>
            <p class="text-highlighted font-mono text-5xl font-bold tabular-nums">
              {{ formattedTime }}
            </p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">
              {{ state.moves }} moves · {{ state.pairs }} pairs
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
              <span class="relative inline-flex items-center gap-2"
                ><Icon
                  name="i-tabler-refresh"
                  aria-hidden="true"
                />
                Play again</span
              >
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
            icon="i-tabler-alert-circle"
          />
        </div>
      </div>

      <p class="text-muted text-center font-mono text-xs">
        Find all eight pairs · no account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
