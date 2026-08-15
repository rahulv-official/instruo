<script setup lang="ts">
import type { TetrisGameState } from "./createTetrisGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createTetrisGame } from "./createTetrisGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<TetrisGameState>({
  status: "ready",
  score: 0,
  lines: 0,
  level: 1,
  best: 0,
});

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
  <ToolWorkbench
    description="Stack falling pieces, clear lines, and climb levels. Keyboard and touch controls work locally in your browser."
  >
    <div class="mx-auto grid max-w-[45rem] gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Tetris</p>
          <p class="text-muted mt-1 font-mono text-xs">Stack Lab · local run</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span
            >Score <strong class="text-highlighted">{{ state.score }}</strong></span
          >
          <span
            >Level <strong class="text-highlighted">{{ state.level }}</strong></span
          >
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
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
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl font-bold"
              aria-hidden="true"
            >
              <Icon name="i-tabler-arrows-move" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Keep the well clear</h2>
            <p class="text-muted text-sm leading-6">
              Move and rotate each piece, then clear complete rows. The board gets faster every ten
              lines.
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
            <p class="text-muted font-mono text-xs">
              ← → / A D move · ↑ / W rotate · Space hard drop · swipe or tap
            </p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tetris-over-title"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-3 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-error text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="i-tabler-alert-triangle" />
            </div>
            <h2
              id="tetris-over-title"
              class="text-highlighted text-xl font-semibold"
            >
              Stack topped out
            </h2>
            <p class="text-highlighted font-mono text-5xl font-bold tabular-nums">
              {{ state.score }}
            </p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">
              Final score · {{ state.lines }} lines cleared
            </p>
            <p class="text-muted text-sm">
              Level {{ state.level }} reached. Best score: {{ state.best }}.
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
                Try again</span
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
        {{ state.lines }} lines cleared · level {{ state.level }} · no account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
