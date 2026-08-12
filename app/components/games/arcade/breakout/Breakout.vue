<script setup lang="ts">
import type { BreakoutGameState } from "./createBreakoutGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createBreakoutGame } from "./createBreakoutGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<BreakoutGameState>({
  status: "ready",
  score: 0,
  lives: 3,
  bricks: 48,
  totalBricks: 48,
  won: false,
});

const resultTitle = computed(() => state.value.won ? "Brick yard cleared" : "Ball lost");
const resultCopy = computed(() => state.value.won ? "Every brick is down. Clean run." : "Keep the paddle under the ball and try another angle.");

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.score === "number" &&
    typeof next.lives === "number" &&
    typeof next.bricks === "number" &&
    typeof next.totalBricks === "number" &&
    typeof next.won === "boolean"
  ) {
    state.value = {
      status: next.status,
      score: next.score,
      lives: next.lives,
      bricks: next.bricks,
      totalBricks: next.totalBricks,
      won: next.won,
    };
  }
}
</script>

<template>
  <ToolWorkbench description="Keep the ball alive, break every brick, and chase a clean local high score.">
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Breakout</p>
          <p class="text-muted mt-1 font-mono text-xs">Brick Yard · local arcade run</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span>Score <strong class="text-highlighted">{{ state.score }}</strong></span>
          <span><strong class="text-highlighted">{{ state.lives }}</strong> lives</span>
        </div>
      </header>

      <div
        class="relative overflow-hidden border border-default"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #101b2d"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createBreakoutGame"
          label="Breakout game stage"
          loading-title="LOADING BRICK YARD"
          loading-copy="Charging the paddle and ball…"
          loading-background="#101b2d"
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
            <div class="mx-auto grid size-14 place-items-center bg-primary text-2xl text-inverted" aria-hidden="true"><Icon name="tabler:ball-basketball" /></div>
            <h2 class="text-xl font-semibold text-highlighted">Clear the wall</h2>
            <p class="text-sm leading-6 text-muted">Move the paddle with touch, arrows, or A/D. Every collision changes the angle, so aim for the gaps.</p>
            <button
              type="button"
              class="relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold text-inverted transition-transform active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              @click.stop="gameHost?.start()"
            >
              <NuxtImg src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png" alt="" aria-hidden="true" class="absolute inset-0 size-full" width="232" height="70" />
              <span class="relative inline-flex items-center gap-2"><Icon name="tabler:player-play-filled" aria-hidden="true" /> Start game</span>
            </button>
            <p class="font-mono text-xs text-muted">Touch / arrows / A D</p>
          </div>
        </div>

        <div v-if="loaded && state.status === 'over'" class="absolute inset-0 z-10 grid place-items-center bg-default/70 p-5" role="dialog" aria-modal="true" aria-labelledby="breakout-over-title">
          <div class="grid w-full max-w-sm gap-4 border border-default bg-elevated p-6 text-center shadow-xl">
            <div class="mx-auto grid size-14 place-items-center text-2xl text-inverted" :class="state.won ? 'bg-success' : 'bg-error'" aria-hidden="true"><Icon :name="state.won ? 'tabler:trophy' : 'tabler:alert-triangle'" /></div>
            <h2 id="breakout-over-title" class="text-xl font-semibold text-highlighted">{{ resultTitle }}</h2>
            <p class="text-sm leading-6 text-muted">{{ resultCopy }}</p>
            <p class="font-mono text-5xl font-bold tabular-nums text-highlighted">{{ state.score }}</p>
            <p class="font-mono text-xs uppercase tracking-[0.18em] text-muted">Final score · {{ state.lives }} lives left</p>
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

      <p class="text-center font-mono text-xs text-muted">{{ state.bricks }} bricks remain · no account needed</p>
    </div>
  </ToolWorkbench>
</template>
