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
  <ToolWorkbench description="Turn over cards, remember their positions, and clear every pair. Everything runs locally in your browser.">
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Memory Match</p>
          <p class="text-muted mt-1 font-mono text-xs">Shape Vault · local puzzle run</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span><strong class="text-highlighted">{{ state.pairs }}/{{ state.totalPairs }}</strong> pairs</span>
          <span><strong class="text-highlighted">{{ formattedTime }}</strong></span>
        </div>
      </header>

      <div
        class="relative overflow-hidden border border-default"
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

        <div v-if="loaded && state.status === 'ready'" class="absolute inset-0 z-10 grid place-items-center bg-default/70 p-5">
          <div class="grid w-full max-w-sm gap-4 border border-default bg-elevated p-6 text-center shadow-xl">
            <div class="mx-auto grid size-14 place-items-center bg-primary text-2xl text-inverted" aria-hidden="true"><Icon name="tabler:cards" /></div>
            <h2 class="text-xl font-semibold text-highlighted">Match the shapes</h2>
            <p class="text-sm leading-6 text-muted">Reveal two cards at a time. Matching shapes lock in with a burst; mismatches turn back after a short pause.</p>
            <button
              type="button"
              class="relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold text-inverted transition-transform active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              @click.stop="gameHost?.start()"
            >
              <NuxtImg src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png" alt="" aria-hidden="true" class="absolute inset-0 size-full" width="232" height="70" />
              <span class="relative inline-flex items-center gap-2"><Icon name="tabler:player-play-filled" aria-hidden="true" /> Start game</span>
            </button>
            <p class="font-mono text-xs text-muted">Tap cards · arrows + Enter</p>
          </div>
        </div>

        <div v-if="loaded && state.status === 'over'" class="absolute inset-0 z-10 grid place-items-center bg-default/70 p-5" role="dialog" aria-modal="true" aria-labelledby="memory-match-over-title">
          <div class="grid w-full max-w-sm gap-4 border border-default bg-elevated p-6 text-center shadow-xl">
            <div class="mx-auto grid size-14 place-items-center bg-success text-2xl text-inverted" aria-hidden="true"><Icon name="tabler:confetti" /></div>
            <h2 id="memory-match-over-title" class="text-xl font-semibold text-highlighted">Shape vault complete</h2>
            <p class="font-mono text-5xl font-bold tabular-nums text-highlighted">{{ formattedTime }}</p>
            <p class="font-mono text-xs uppercase tracking-[0.18em] text-muted">{{ state.moves }} moves · {{ state.pairs }} pairs</p>
            <button
              type="button"
              class="relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold text-inverted transition-transform active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              @click.stop="gameHost?.restart()"
            >
              <NuxtImg src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png" alt="" aria-hidden="true" class="absolute inset-0 size-full" width="232" height="70" />
              <span class="relative inline-flex items-center gap-2"><Icon name="tabler:refresh" aria-hidden="true" /> Play again</span>
            </button>
          </div>
        </div>

        <div v-if="gameError" class="absolute inset-0 z-20 grid place-items-center bg-default p-5" role="alert">
          <UAlert color="error" variant="subtle" title="Game unavailable" description="Reload the page and try once more." icon="i-lucide-circle-alert" />
        </div>
      </div>

      <p class="text-center font-mono text-xs text-muted">Find all eight pairs · no account needed</p>
    </div>
  </ToolWorkbench>
</template>
