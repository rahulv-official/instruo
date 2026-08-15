<script setup lang="ts">
import type { FlappyBirdState } from "./createFlappyBirdGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createFlappyBirdGame } from "./createFlappyBirdGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<FlappyBirdState>({ status: "ready", score: 0, best: 0 });

function updateState(nextState: Record<string, unknown>) {
  if (
    (nextState.status === "ready" ||
      nextState.status === "playing" ||
      nextState.status === "over") &&
    typeof nextState.score === "number" &&
    typeof nextState.best === "number"
  ) {
    state.value = {
      status: nextState.status,
      score: nextState.score,
      best: nextState.best,
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="A bright, local flight game. Guide the bird through rocky gates, chase your best score, and play again instantly."
  >
    <div class="mx-auto grid max-w-xl gap-5">
      <div class="border-default/70 flex items-center justify-between border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Skybound</p>
          <p class="text-muted mt-1 font-mono text-xs">Flappy Bird · local arcade run</p>
        </div>
        <div class="text-muted flex gap-4 font-mono text-xs">
          <span>
            Score <strong class="text-highlighted">{{ state.score }}</strong>
          </span>
          <span>
            Best <strong class="text-highlighted">{{ state.best }}</strong>
          </span>
        </div>
      </div>

      <div
        class="flappy-stage"
        data-phaser-game-shell
        :class="{ 'is-over': loaded && state.status === 'over' }"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createFlappyBirdGame"
          label="Flappy Bird game stage"
          loading-title="LOADING SKY"
          loading-copy="Warming up your wings…"
          @state="updateState"
          @ready="loaded = true"
          @error="gameError = true"
        />

        <PhaserFullscreenButton
          :is-fullscreen="gameHost?.isFullscreen ?? false"
          @toggle="gameHost?.toggleFullscreen()"
        />

        <Transition name="flappy-fade">
          <div
            v-if="loaded && state.status === 'ready'"
            class="flappy-overlay flappy-overlay--start"
          >
            <div class="flappy-card">
              <div
                class="flappy-card__spark"
                aria-hidden="true"
              >
                ✦
              </div>
              <h2>Ready for takeoff?</h2>
              <p>Keep the bird in the clear sky. One tap keeps the journey going.</p>
              <button
                type="button"
                class="flappy-asset-button"
                @click.stop="gameHost?.start()"
              >
                <NuxtImg
                  src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                  alt=""
                  aria-hidden="true"
                  width="232"
                  height="70"
                />
                <span>
                  <Icon
                    name="i-tabler-player-play-filled"
                    aria-hidden="true"
                  />
                  Play now
                </span>
              </button>
              <p class="flappy-card__hint">Click, tap, or press Space</p>
            </div>
          </div>
        </Transition>

        <Transition name="flappy-fade">
          <div
            v-if="loaded && state.status === 'over'"
            class="flappy-overlay flappy-overlay--over"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flappy-over-title"
          >
            <div class="flappy-card flappy-card--over">
              <div
                class="flappy-card__mark"
                aria-hidden="true"
              >
                <Icon name="i-tabler-wind" />
              </div>
              <h2 id="flappy-over-title">Flight over</h2>
              <p class="flappy-card__score">{{ state.score }}</p>
              <p class="flappy-card__label">SCORE</p>
              <p class="flappy-card__best">BEST&nbsp;&nbsp; {{ state.best }}</p>
              <button
                type="button"
                class="flappy-asset-button"
                @click.stop="gameHost?.restart()"
              >
                <NuxtImg
                  src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                  alt=""
                  aria-hidden="true"
                  width="232"
                  height="70"
                />
                <span>
                  <Icon
                    name="i-tabler-refresh"
                    aria-hidden="true"
                  />
                  Try again
                </span>
              </button>
              <p class="flappy-card__hint">Your next flight starts fresh</p>
            </div>
          </div>
        </Transition>

        <div
          v-if="gameError"
          class="flappy-overlay flappy-overlay--error"
          role="alert"
        >
          <div class="flappy-card flappy-card--over">
            <div
              class="flappy-card__mark"
              aria-hidden="true"
            >
              <Icon name="i-tabler-alert-triangle" />
            </div>
            <h2>Flight deck unavailable</h2>
            <p>Something blocked the game renderer. Reload this page and try once more.</p>
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
        Click, tap, or press Space to flap. No account needed.
      </p>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.flappy-stage {
  --phaser-game-loading-bg: #b9e6f3;
  --phaser-game-loading-fg: #17324c;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: #b9e6f3;
  box-shadow: 0 20px 58px rgb(23 50 76 / 16%);
}

.flappy-stage :deep(.phaser-game-host) {
  border: 0;
  border-radius: 10px;
  box-shadow: none;
}

.flappy-stage.is-over :deep(canvas) {
  filter: blur(6px) saturate(0.72);
  transform: scale(1.035);
  transition:
    filter 280ms ease,
    transform 280ms ease;
}

.flappy-overlay {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgb(23 50 76 / 16%);
}

.flappy-overlay--over {
  background: rgb(23 50 76 / 28%);
  backdrop-filter: blur(2px);
}

.flappy-card {
  width: min(100%, 20rem);
  padding: 2rem 1.5rem 1.5rem;
  border: 2px solid rgb(23 50 76 / 13%);
  border-radius: 10px;
  background: #fff6dc;
  color: #17324c;
  text-align: center;
  box-shadow: 0 24px 44px rgb(23 50 76 / 23%);
}

.flappy-card--over {
  padding-top: 1.5rem;
}

.flappy-card h2 {
  margin: 0;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.flappy-card p {
  margin: 0.65rem auto 0;
  max-width: 17rem;
  color: #32627b;
  font-size: 0.83rem;
  line-height: 1.55;
}

.flappy-card__spark,
.flappy-card__mark {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  margin: 0 auto 0.85rem;
  place-items: center;
  border-radius: 999px;
  background: #f4bd68;
  color: #17324c;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 1.25rem;
}

.flappy-card__mark {
  background: #f3c8a3;
  color: #b74732;
}

.flappy-asset-button {
  position: relative;
  display: grid;
  width: 232px;
  height: 70px;
  margin: 1.4rem auto 0;
  place-items: center;
  border: 0;
  color: #fff;
  cursor: pointer;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition:
    transform 140ms ease,
    filter 140ms ease;
}

.flappy-asset-button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.flappy-asset-button span {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.flappy-asset-button:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
}

.flappy-asset-button:active {
  transform: translateY(1px);
}

.flappy-asset-button:focus-visible {
  outline: 3px solid #17324c;
  outline-offset: 4px;
}

.flappy-card__hint {
  font-family: var(--font-mono);
  font-size: 0.65rem !important;
  letter-spacing: 0.02em;
}

.flappy-card__score {
  margin-top: 0.25rem !important;
  color: #17324c !important;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 3.3rem !important;
  font-weight: 700;
  line-height: 1;
}

.flappy-card__label {
  margin-top: 0.25rem !important;
  color: #32627b !important;
  font-family: var(--font-mono);
  font-size: 0.62rem !important;
  letter-spacing: 0.14em;
}

.flappy-card__best {
  margin-top: 0.45rem !important;
  color: #32627b !important;
  font-family: var(--font-mono);
  font-size: 0.74rem !important;
}

.flappy-fade-enter-active,
.flappy-fade-leave-active {
  transition: opacity 180ms ease;
}

.flappy-fade-enter-from,
.flappy-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .flappy-stage.is-over :deep(canvas),
  .flappy-asset-button {
    transition: none;
  }
}
</style>
