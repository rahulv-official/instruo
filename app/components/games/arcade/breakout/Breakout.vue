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
  level: 1,
  bricks: 48,
  totalBricks: 48,
  won: false,
});

const resultTitle = computed(() => `Run over at level ${state.value.level}`);
const resultCopy = computed(() => "Keep the paddle under the ball and try another angle.");

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.score === "number" &&
    typeof next.lives === "number" &&
    typeof next.level === "number" &&
    typeof next.bricks === "number" &&
    typeof next.totalBricks === "number" &&
    typeof next.won === "boolean"
  ) {
    state.value = {
      status: next.status,
      score: next.score,
      lives: next.lives,
      level: next.level,
      bricks: next.bricks,
      totalBricks: next.totalBricks,
      won: next.won,
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="Keep the ball alive, break every brick, and chase a clean local high score."
  >
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Breakout</p>
          <p class="text-muted mt-1 font-mono text-xs">Brick Yard · continuous seeded run</p>
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
        class="border-default relative overflow-hidden rounded-lg border"
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

        <div
          v-if="loaded && state.status === 'ready'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 rounded-lg border p-6 text-center shadow-xl"
          >
            <div
              class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="i-tabler-arrows-horizontal" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Keep the ball alive</h2>
            <p class="text-muted text-sm leading-6">
              Drag the paddle under the ball. Keyboard players can use ← → or A / D. Break every
              brick to unlock a faster pattern.
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
            <p class="text-muted font-mono text-xs">Drag · ← → · A D</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="breakout-over-title"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 rounded-lg border p-6 text-center shadow-xl"
          >
            <div
              class="text-inverted mx-auto grid size-14 place-items-center text-2xl"
              :class="state.won ? 'bg-success' : 'bg-error'"
              aria-hidden="true"
            >
              <Icon :name="state.won ? 'i-tabler-trophy' : 'i-tabler-alert-triangle'" />
            </div>
            <h2
              id="breakout-over-title"
              class="text-highlighted text-xl font-semibold"
            >
              {{ resultTitle }}
            </h2>
            <p class="text-muted text-sm leading-6">{{ resultCopy }}</p>
            <p class="text-highlighted font-mono text-5xl font-bold tabular-nums">
              {{ state.score }}
            </p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">
              Level {{ state.level }} · {{ state.lives }} lives left
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
        Level {{ state.level }} · {{ state.bricks }}/{{ state.totalBricks }} bricks remain · no
        account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
