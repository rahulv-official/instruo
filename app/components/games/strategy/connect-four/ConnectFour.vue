<script setup lang="ts">
import type { ConnectFourGameState } from "./createConnectFourGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createConnectFourGame } from "./createConnectFourGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<ConnectFourGameState>({
  status: "ready",
  currentPlayer: "red",
  winner: null,
  moves: 0,
  winningLine: [],
});

const playerLabel = computed(() => (state.value.currentPlayer === "red" ? "Red" : "Yellow"));
const resultTitle = computed(() =>
  state.value.winner ? `${state.value.winner === "red" ? "Red" : "Yellow"} wins` : "Board full",
);
const resultCopy = computed(() =>
  state.value.winner
    ? "Four connected. Clean drop, strong finish."
    : "Every slot is filled. Reset and try a new opening.",
);

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    (next.currentPlayer === "red" || next.currentPlayer === "yellow") &&
    (next.winner === null || next.winner === "red" || next.winner === "yellow") &&
    typeof next.moves === "number" &&
    Array.isArray(next.winningLine)
  ) {
    state.value = {
      status: next.status,
      currentPlayer: next.currentPlayer,
      winner: next.winner,
      moves: next.moves,
      winningLine: next.winningLine.filter((value): value is number => typeof value === "number"),
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="Drop discs into a physical-feeling board. First player to connect four wins."
  >
    <div class="mx-auto grid max-w-xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Connect Four</p>
          <p class="text-muted mt-1 font-mono text-xs">Drop Zone · two-player local match</p>
        </div>
        <div class="text-muted flex items-center gap-3 font-mono text-xs">
          <span>{{ playerLabel }} to move</span>
          <span
            ><strong class="text-highlighted">{{ state.moves }}</strong
            >/42</span
          >
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #162336"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createConnectFourGame"
          label="Connect Four game stage"
          loading-title="LOADING DROP ZONE"
          loading-copy="Polishing the board and discs…"
          loading-background="#162336"
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
              <Icon name="i-tabler-circle-dot" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Set your opening</h2>
            <p class="text-muted text-sm leading-6">
              Red starts. Drop discs, watch them bounce into place, and build a line before your
              opponent does.
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
                Start match</span
              >
            </button>
            <p class="text-muted font-mono text-xs">Tap a column · arrows + Enter</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connect-four-over-title"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon :name="state.winner ? 'i-tabler-trophy' : 'i-tabler-equal'" />
            </div>
            <h2
              id="connect-four-over-title"
              class="text-highlighted text-xl font-semibold"
            >
              {{ resultTitle }}
            </h2>
            <p class="text-muted text-sm leading-6">{{ resultCopy }}</p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">
              {{ state.moves }} moves played
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
                New match</span
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
        Red starts · bounce, block, connect four · no account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
