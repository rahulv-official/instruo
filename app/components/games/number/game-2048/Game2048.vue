<script setup lang="ts">
import type { Game2048State } from "./createGame2048";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createGame2048 } from "./createGame2048";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<Game2048State>({
  status: "ready",
  score: 0,
  highest: 4,
  won: false,
});

function updateState(nextState: Record<string, unknown>) {
  if (
    (nextState.status === "ready" ||
      nextState.status === "playing" ||
      nextState.status === "over") &&
    typeof nextState.score === "number" &&
    typeof nextState.highest === "number" &&
    typeof nextState.won === "boolean"
  ) {
    state.value = {
      status: nextState.status,
      score: nextState.score,
      highest: nextState.highest,
      won: nextState.won,
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="Slide and merge matching tiles until you create 2048. Runs locally in your browser."
  >
    <div class="mx-auto grid max-w-xl gap-5">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">2048</p>
          <p class="text-muted mt-1 font-mono text-xs">Merge Lab · local puzzle run</p>
        </div>
        <div class="text-muted flex gap-4 font-mono text-xs">
          <span
            >Score <strong class="text-highlighted">{{ state.score }}</strong></span
          >
          <span
            >Best <strong class="text-highlighted">{{ state.highest }}</strong></span
          >
        </div>
      </div>

      <div
        class="game-2048-stage"
        data-phaser-game-shell
        :class="{ 'is-over': loaded && state.status === 'over' }"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createGame2048"
          label="2048 game stage"
          loading-title="LOADING PUZZLE"
          loading-copy="Setting up the merge grid…"
          @state="updateState"
          @ready="loaded = true"
          @error="gameError = true"
        />

        <PhaserFullscreenButton
          :is-fullscreen="gameHost?.isFullscreen ?? false"
          @toggle="gameHost?.toggleFullscreen()"
        />

        <Transition name="game-fade">
          <div
            v-if="loaded && state.status === 'ready'"
            class="game-overlay"
          >
            <div class="game-card">
              <div
                class="game-card__mark"
                aria-hidden="true"
              >
                2048
              </div>
              <h2>Ready to merge?</h2>
              <p>
                Slide equal tiles together. Build your chain, protect your corner, and chase 2048.
              </p>
              <button
                type="button"
                class="game-asset-button"
                @click.stop="gameHost?.start()"
              >
                <NuxtImg
                  src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                  alt=""
                  aria-hidden="true"
                  width="232"
                  height="70"
                />
                <span
                  ><Icon
                    name="i-tabler-player-play-filled"
                    aria-hidden="true"
                  />
                  Start game</span
                >
              </button>
              <p class="game-card__hint">Swipe, arrows, or WASD</p>
            </div>
          </div>
        </Transition>

        <Transition name="game-fade">
          <div
            v-if="loaded && state.status === 'over'"
            class="game-overlay game-overlay--over"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-2048-over-title"
          >
            <div class="game-card">
              <div
                class="game-card__mark game-card__mark--over"
                aria-hidden="true"
              >
                <Icon name="i-tabler-rotate-2" />
              </div>
              <h2 id="game-2048-over-title">No more moves</h2>
              <p class="game-card__score">{{ state.score }}</p>
              <p class="game-card__label">FINAL SCORE</p>
              <p class="game-card__best">HIGHEST TILE&nbsp;&nbsp; {{ state.highest }}</p>
              <button
                type="button"
                class="game-asset-button"
                @click.stop="gameHost?.restart()"
              >
                <NuxtImg
                  src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                  alt=""
                  aria-hidden="true"
                  width="232"
                  height="70"
                />
                <span
                  ><Icon
                    name="i-tabler-refresh"
                    aria-hidden="true"
                  />
                  Try again</span
                >
              </button>
              <p class="game-card__hint">One empty square can change everything</p>
            </div>
          </div>
        </Transition>

        <div
          v-if="gameError"
          class="game-overlay"
          role="alert"
        >
          <div class="game-card">
            <div
              class="game-card__mark game-card__mark--over"
              aria-hidden="true"
            >
              <Icon name="i-tabler-alert-triangle" />
            </div>
            <h2>Game unavailable</h2>
            <p>Something blocked the game renderer. Reload the page and try once more.</p>
          </div>
        </div>
      </div>

      <p
        v-if="gameError"
        class="text-error text-center text-sm"
        role="alert"
      >
        The game could not load. Reload the page to try again.
      </p>
      <p class="text-muted text-center font-mono text-xs">
        Swipe the board, or use arrow keys and WASD. No account needed.
      </p>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.game-2048-stage {
  --phaser-game-loading-bg: #23232a;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: #23232a;
  box-shadow: 0 20px 58px rgb(35 35 42 / 20%);
}

.game-2048-stage :deep(.phaser-game-host) {
  border: 0;
  border-radius: 10px;
  background: #23232a;
  box-shadow: none;
  touch-action: none;
}

.game-2048-stage.is-over :deep(canvas) {
  filter: blur(6px) saturate(0.72);
  transform: scale(1.035);
  transition:
    filter 280ms ease,
    transform 280ms ease;
}

.game-overlay {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgb(35 35 42 / 28%);
}

.game-overlay--over {
  background: rgb(35 35 42 / 44%);
  backdrop-filter: blur(2px);
}

.game-card {
  width: min(100%, 20rem);
  padding: 1.8rem 1.5rem 1.5rem;
  border: 2px solid rgb(255 246 220 / 18%);
  border-radius: 10px;
  background: #fff6dc;
  color: #263b4d;
  text-align: center;
  box-shadow: 0 24px 44px rgb(23 50 76 / 28%);
}

.game-card h2 {
  margin: 0;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.game-card p {
  margin: 0.65rem auto 0;
  max-width: 17rem;
  color: #53677a;
  font-size: 0.83rem;
  line-height: 1.55;
}

.game-card__mark {
  display: grid;
  width: 3.3rem;
  height: 3.3rem;
  margin: 0 auto 0.85rem;
  place-items: center;
  border-radius: 10px;
  background: #54c28a;
  color: #ffffff;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
}

.game-card__mark--over {
  border-radius: 999px;
  background: #f3c8a3;
  color: #b74732;
  font-size: 1.25rem;
}

.game-asset-button {
  position: relative;
  display: grid;
  width: 232px;
  height: 70px;
  margin: 1.35rem auto 0;
  place-items: center;
  border: 0;
  color: #fff;
  cursor: pointer;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition:
    transform 140ms ease,
    filter 140ms ease;
}

.game-asset-button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.game-asset-button span {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.game-asset-button:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
}

.game-asset-button:active {
  transform: translateY(1px);
}

.game-asset-button:focus-visible {
  outline: 3px solid #263b4d;
  outline-offset: 4px;
}

.game-card__hint {
  font-family: var(--font-mono);
  font-size: 0.65rem !important;
}

.game-card__score {
  margin-top: 0.25rem !important;
  color: #263b4d !important;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 3.1rem !important;
  font-weight: 700;
  line-height: 1;
}

.game-card__label {
  margin-top: 0.25rem !important;
  color: #53677a !important;
  font-family: var(--font-mono);
  font-size: 0.62rem !important;
  letter-spacing: 0.14em;
}

.game-card__best {
  margin-top: 0.45rem !important;
  color: #53677a !important;
  font-family: var(--font-mono);
  font-size: 0.74rem !important;
}

.game-fade-enter-active,
.game-fade-leave-active {
  transition: opacity 180ms ease;
}

.game-fade-enter-from,
.game-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .game-2048-stage.is-over :deep(canvas),
  .game-asset-button {
    transition: none;
  }
}
</style>
