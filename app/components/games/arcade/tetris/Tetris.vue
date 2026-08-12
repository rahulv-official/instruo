<script setup lang="ts">
import type { TetrisGameState } from "./createTetrisGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createTetrisGame } from "./createTetrisGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<TetrisGameState>({ status: "ready", score: 0, lines: 0, level: 1, best: 0 });

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.score === "number" &&
    typeof next.lines === "number" &&
    typeof next.level === "number" &&
    typeof next.best === "number"
  ) {
    state.value = {
      status: next.status,
      score: next.score,
      lines: next.lines,
      level: next.level,
      best: next.best,
    };
  }
}
</script>

<template>
  <ToolWorkbench description="Stack falling pieces, clear lines, and climb levels. Keyboard and touch controls work locally in your browser.">
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Tetris</p>
          <p class="text-muted mt-1 font-mono text-xs">Stack Lab · local run</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span>Score <strong class="text-highlighted">{{ state.score }}</strong></span>
          <span>Level <strong class="text-highlighted">{{ state.level }}</strong></span>
        </div>
      </header>

      <div
        class="relative overflow-hidden border border-default"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #151d2b"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createTetrisGame"
          label="Tetris game stage"
          loading-title="LOADING STACK LAB"
          loading-copy="Calibrating the falling pieces…"
          loading-background="#151d2b"
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
          class="absolute inset-0 z-10 grid place-items-center bg-default/70 p-5"
        >
          <div class="grid w-full max-w-sm gap-4 border border-default bg-elevated p-6 text-center shadow-xl">
            <div class="mx-auto grid size-14 place-items-center bg-primary text-2xl font-bold text-inverted" aria-hidden="true">
              <Icon name="tabler:blocks" />
            </div>
            <h2 class="text-xl font-semibold text-highlighted">Build your stack</h2>
            <p class="text-sm leading-6 text-muted">Fit pieces, clear lines, and keep the well open. Every drop speeds up the next level.</p>
            <button
              type="button"
              class="relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold text-inverted transition-transform active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              @click.stop="gameHost?.start()"
            >
              <NuxtImg src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png" alt="" aria-hidden="true" class="absolute inset-0 size-full" width="232" height="70" />
              <span class="relative inline-flex items-center gap-2"><Icon name="tabler:player-play-filled" aria-hidden="true" /> Start game</span>
            </button>
            <p class="font-mono text-xs text-muted">Arrows / WASD · Space hard drop · Swipe or tap</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="absolute inset-0 z-10 grid place-items-center bg-default/70 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tetris-over-title"
        >
          <div class="grid w-full max-w-sm gap-3 border border-default bg-elevated p-6 text-center shadow-xl">
            <div class="mx-auto grid size-14 place-items-center bg-error text-2xl text-inverted" aria-hidden="true"><Icon name="tabler:alert-triangle" /></div>
            <h2 id="tetris-over-title" class="text-xl font-semibold text-highlighted">Stack topped out</h2>
            <p class="font-mono text-5xl font-bold tabular-nums text-highlighted">{{ state.score }}</p>
            <p class="font-mono text-xs uppercase tracking-[0.18em] text-muted">Final score · {{ state.lines }} lines cleared</p>
            <p class="text-sm text-muted">Level {{ state.level }} reached. Best score: {{ state.best }}.</p>
            <button
              type="button"
              class="relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold text-inverted transition-transform active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              @click.stop="gameHost?.restart()"
            >
              <NuxtImg src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png" alt="" aria-hidden="true" class="absolute inset-0 size-full" width="232" height="70" />
              <span class="relative inline-flex items-center gap-2"><Icon name="tabler:refresh" aria-hidden="true" /> Try again</span>
            </button>
          </div>
        </div>

        <div v-if="gameError" class="absolute inset-0 z-20 grid place-items-center bg-default p-5" role="alert">
          <UAlert color="error" variant="subtle" title="Game unavailable" description="Reload the page and try once more." icon="i-lucide-circle-alert" />
        </div>
      </div>

      <p class="text-center font-mono text-xs text-muted">{{ state.lines }} lines cleared · no account needed</p>
    </div>
  </ToolWorkbench>
</template>
