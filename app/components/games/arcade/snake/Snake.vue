<script setup lang="ts">
import type { SnakeGameState, SnakeStageId } from "./createSnakeGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createSnakeGame, SNAKE_STAGES } from "./createSnakeGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const soundMuted = ref(false);
const selectedStage = ref<SnakeStageId>("meadow");
const state = shallowRef<SnakeGameState>({
  status: "ready",
  paused: false,
  score: 0,
  best: 0,
  stage: "meadow",
});

const selectedStageInfo = computed(() =>
  SNAKE_STAGES.find((stage) => stage.id === selectedStage.value)!,
);
const currentStageInfo = computed(() =>
  SNAKE_STAGES.find((stage) => stage.id === state.value.stage)!,
);
const stageSurface = computed(
  () => `#${selectedStageInfo.value.background.toString(16).padStart(6, "0")}`,
);
const statusCopy = computed(() => {
  if (state.value.status === "over" || state.value.status === "won") return state.value.detail;
  if (state.value.paused) return "Paused. Space resumes the run.";
  if (state.value.status === "playing")
    return `${currentStageInfo.value.label} is live. Find the next glow.`;
  return "Choose a stage, then start your run.";
});

function selectStage(stage: SnakeStageId) {
  selectedStage.value = stage;
}

function startSelected() {
  gameHost.value?.start(selectedStage.value);
}

function retrySelected() {
  gameHost.value?.restart(selectedStage.value);
}

function toggleSound() {
  soundMuted.value = !soundMuted.value;
  gameHost.value?.toggleMute();
}

function updateState(nextState: Record<string, unknown>) {
  const status = nextState.status;
  const stage = nextState.stage;
  if (
    (status === "ready" || status === "playing" || status === "over" || status === "won") &&
    (stage === "meadow" || stage === "circuit" || stage === "ruins") &&
    typeof nextState.score === "number" &&
    typeof nextState.best === "number" &&
    typeof nextState.paused === "boolean"
  ) {
    state.value = {
      status,
      paused: nextState.paused,
      score: nextState.score,
      best: nextState.best,
      stage,
      detail: typeof nextState.detail === "string" ? nextState.detail : undefined,
    };
    selectedStage.value = stage;
  }
}
</script>

<template>
  <ToolWorkbench
    description="Guide a growing snake through three handcrafted stages. Pick your route before every run; no account needed."
  >
    <div class="snake-game">
      <header class="snake-game__header">
        <div>
          <p class="text-highlighted text-sm font-semibold">Snake</p>
          <p class="text-muted mt-1 font-mono text-xs">Serpent Run · three routes</p>
        </div>
        <div class="snake-game__stats">
          <button
            v-if="loaded"
            type="button"
            class="snake-audio-toggle"
            :aria-pressed="soundMuted"
            :aria-label="soundMuted ? 'Turn sound on' : 'Mute sound'"
            :title="soundMuted ? 'Turn sound on' : 'Mute sound'"
            @click="toggleSound"
          >
            <Icon
              :name="soundMuted ? 'tabler:volume-off' : 'tabler:volume'"
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <div
        class="snake-stage"
        data-phaser-game-shell
        :style="{ '--snake-stage-surface': stageSurface }"
        :class="{ 'is-over': loaded && (state.status === 'over' || state.status === 'won') }"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createSnakeGame"
          label="Snake game stage"
          loading-title="LOADING SERPENT RUN"
          loading-copy="Building three routes…"
          @state="updateState"
          @ready="loaded = true"
          @error="gameError = true"
        />

        <PhaserFullscreenButton
          :is-fullscreen="gameHost?.isFullscreen ?? false"
          @toggle="gameHost?.toggleFullscreen()"
        />

        <Transition name="snake-fade">
          <div
            v-if="loaded && state.status === 'ready'"
            class="snake-overlay"
            aria-labelledby="snake-start-title"
          >
            <div class="snake-card">
              <div class="snake-card__eyebrow">SELECT YOUR ROUTE</div>
              <h2 id="snake-start-title">Where will you run?</h2>
              <p class="snake-card__intro">
                Each stage changes the pace, palette, and shape of the board.
              </p>

              <div
                class="snake-stage-picker"
                role="group"
                aria-label="Snake stages"
              >
                <button
                  v-for="stage in SNAKE_STAGES"
                  :key="stage.id"
                  type="button"
                  class="snake-stage-option"
                  :class="[
                    `snake-stage-option--${stage.id}`,
                    { 'is-selected': selectedStage === stage.id },
                  ]"
                  :aria-pressed="selectedStage === stage.id"
                  @click.stop="selectStage(stage.id)"
                >
                  <span class="snake-stage-option__number"
                    >0{{ SNAKE_STAGES.indexOf(stage) + 1 }}</span
                  >
                  <span>
                    <strong>{{ stage.label }}</strong>
                    <small>{{ stage.subtitle }}</small>
                  </span>
                  <Icon
                    name="tabler:arrow-up-right"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <p class="snake-card__selected">
                <strong>{{ selectedStageInfo.label }}</strong> — {{ selectedStageInfo.description }}
              </p>
              <button
                type="button"
                class="snake-asset-button"
                @click.stop="startSelected"
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
                    name="tabler:player-play-filled"
                    aria-hidden="true"
                  />
                  Start {{ selectedStageInfo.label }}</span
                >
              </button>
              <p class="snake-card__hint">Swipe or arrows / WASD · Space pauses</p>
            </div>
          </div>
        </Transition>

        <div
          v-if="loaded && (state.status === 'over' || state.status === 'won')"
          class="snake-overlay snake-overlay--over"
          role="dialog"
          aria-modal="true"
          aria-labelledby="snake-over-title"
        >
          <div class="snake-card snake-card--over">
            <div class="snake-card__eyebrow">
              {{ state.status === "won" ? "ROUTE CLEARED" : "RUN ENDED" }}
            </div>
            <h2 id="snake-over-title">
              {{ state.status === "won" ? "You owned the board." : "The board bit back." }}
            </h2>
            <p class="snake-card__score">{{ state.score }}</p>
            <p class="snake-card__label">{{ currentStageInfo.label.toUpperCase() }} · SCORE</p>
            <p class="snake-card__result">{{ statusCopy }}</p>
            <div
              class="snake-stage-picker snake-stage-picker--retry"
              role="group"
              aria-label="Choose a stage for your next run"
            >
              <button
                v-for="stage in SNAKE_STAGES"
                :key="stage.id"
                type="button"
                class="snake-stage-option"
                :class="[
                  `snake-stage-option--${stage.id}`,
                  { 'is-selected': selectedStage === stage.id },
                ]"
                :aria-pressed="selectedStage === stage.id"
                @click.stop="selectStage(stage.id)"
              >
                <span class="snake-stage-option__number"
                  >0{{ SNAKE_STAGES.indexOf(stage) + 1 }}</span
                >
                <span
                  ><strong>{{ stage.label }}</strong
                  ><small>{{ stage.interval }} ms</small></span
                >
                <Icon
                  name="tabler:arrow-up-right"
                  aria-hidden="true"
                />
              </button>
            </div>
            <button
              type="button"
              class="snake-asset-button"
              @click.stop="retrySelected"
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
                  name="tabler:refresh"
                  aria-hidden="true"
                />
                Run {{ selectedStageInfo.label }}</span
              >
            </button>
          </div>
        </div>

        <div
          v-if="gameError"
          class="snake-overlay"
          role="alert"
        >
          <div class="snake-card">
            <div class="snake-card__eyebrow">SIGNAL LOST</div>
            <h2>Game unavailable</h2>
            <p>Reload this page to rebuild the board.</p>
          </div>
        </div>
      </div>

      <p
        class="snake-game__status"
        role="status"
        aria-live="polite"
      >
        <Icon
          :name="
            state.status === 'over'
              ? 'tabler:skull'
              : state.status === 'won'
                ? 'tabler:trophy'
                : state.paused
                  ? 'tabler:player-pause'
                  : 'tabler:route-2'
          "
          aria-hidden="true"
        />
        {{ statusCopy }}
      </p>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.snake-game {
  display: grid;
  width: min(100%, 34rem);
  gap: 1rem;
  margin-inline: auto;
}

.snake-game__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ui-text) 18%, transparent);
  padding-bottom: 0.9rem;
}

.snake-game__stats {
  display: flex;
  align-items: center;
}

.snake-stage {
  --phaser-game-loading-bg: var(--snake-stage-surface, #102f36);
  position: relative;
  overflow: hidden;
  border-radius: 0;
  background: var(--snake-stage-surface, #102f36);
  box-shadow: 0 22px 64px rgb(16 47 54 / 22%);
}

.snake-stage :deep(.phaser-game-host) {
  border: 0;
  border-radius: 0;
  background: var(--snake-stage-surface, #102f36);
  box-shadow: none;
}

.snake-stage :deep(.phaser-game-host canvas) {
  background: var(--snake-stage-surface, #102f36) !important;
  transition: none !important;
}

.snake-stage.is-over :deep(canvas) {
  filter: blur(7px) saturate(0.7);
}

.snake-overlay {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: var(--snake-stage-surface, #102f36);
}

.snake-overlay--over {
  background: rgb(11 29 34 / 52%);
  backdrop-filter: blur(3px);
}

.snake-card {
  width: min(100%, 22rem);
  max-height: calc(100% - 1rem);
  overflow: auto;
  padding: 1.25rem 1.1rem 1rem;
  border: 1px solid rgb(246 243 229 / 26%);
  border-radius: 0;
  background: #f6f1df;
  color: #19353b;
  text-align: center;
  box-shadow: 0 24px 52px rgb(4 19 24 / 34%);
}

.snake-card--over {
  padding-top: 1.1rem;
}
.snake-card h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}
.snake-card__eyebrow {
  color: #d05d3f;
  font-family: var(--font-mono), monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}
.snake-card__intro,
.snake-card__result {
  margin: 0.5rem auto 0;
  max-width: 18rem;
  color: #587076;
  font-size: 0.77rem;
  line-height: 1.45;
}
.snake-card__selected {
  min-height: 2.25rem;
  margin: 0.7rem auto 0;
  max-width: 19rem;
  color: #587076;
  font-size: 0.72rem;
  line-height: 1.4;
}
.snake-card__selected strong {
  color: #19353b;
}
.snake-card__score {
  margin: 0.2rem 0 0;
  color: #19353b;
  font-family: var(--font-mono), monospace;
  font-size: 2.65rem;
  font-weight: 800;
  line-height: 1;
}
.snake-card__label {
  margin: 0.25rem 0 0;
  color: #d05d3f;
  font-family: var(--font-mono), monospace;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
}

.snake-stage-picker {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.8rem;
  text-align: left;
}
.snake-stage-picker--retry {
  margin-top: 0.75rem;
}

.snake-stage-option {
  display: grid;
  grid-template-columns: 1.65rem 1fr auto;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  min-height: 3.15rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid #c9d3c8;
  border-radius: 0;
  background: #e9eadc;
  color: #19353b;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 140ms ease,
    background-color 140ms ease,
    transform 140ms ease;
}

.snake-stage-option:hover {
  transform: translateY(-1px);
}
.snake-stage-option.is-selected {
  border-color: var(--stage-accent, #2e8974);
  background: #fbf8ec;
  box-shadow: inset 3px 0 0 var(--stage-accent, #2e8974);
}
.snake-stage-option--meadow {
  --stage-accent: #2e9870;
}
.snake-stage-option--circuit {
  --stage-accent: #6362c5;
}
.snake-stage-option--ruins {
  --stage-accent: #d05d3f;
}
.snake-stage-option__number {
  color: var(--stage-accent, #2e8974);
  font-family: var(--font-mono), monospace;
  font-size: 0.67rem;
  font-weight: 700;
}
.snake-stage-option strong,
.snake-stage-option small {
  display: block;
}
.snake-stage-option strong {
  font-size: 0.75rem;
}
.snake-stage-option small {
  margin-top: 0.12rem;
  color: #667d80;
  font-size: 0.65rem;
}
.snake-stage-option > .icon {
  width: 1rem;
  height: 1rem;
  color: var(--stage-accent, #2e8974);
}

.snake-asset-button {
  position: relative;
  display: grid;
  width: 232px;
  height: 70px;
  place-items: center;
  margin: 0.85rem auto 0;
  border: 0;
  color: #fff;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 750;
  transition:
    filter 140ms ease,
    transform 140ms ease;
}

.snake-asset-button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.snake-asset-button span {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.snake-asset-button:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.snake-asset-button:active {
  transform: translateY(1px);
}
.snake-asset-button:focus-visible,
.snake-stage-option:focus-visible,
.snake-audio-toggle:focus-visible {
  outline: 3px solid #d05d3f;
  outline-offset: 3px;
}
.snake-card__hint {
  margin: 0.45rem 0 0;
  color: #728487;
  font-family: var(--font-mono), monospace;
  font-size: 0.61rem;
}

.snake-audio-toggle {
  display: grid;
  width: 2.45rem;
  height: 2.45rem;
  place-items: center;
  border: 1px solid rgb(246 243 229 / 28%);
  border-radius: 0;
  background: rgb(11 29 34 / 76%);
  color: #f6f1df;
  cursor: pointer;
}

.snake-audio-toggle:hover {
  background: rgb(11 29 34 / 92%);
}

.snake-game__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 1.5rem;
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.76rem;
  text-align: center;
}

.snake-game__status .icon {
  width: 1rem;
  height: 1rem;
  color: #d05d3f;
}

.snake-fade-enter-active,
.snake-fade-leave-active {
  transition: opacity 180ms ease;
}
.snake-fade-enter-from,
.snake-fade-leave-to {
  opacity: 0;
}

@media (max-width: 30rem) {
  .snake-card {
    padding-inline: 0.8rem;
  }
  .snake-stage-option {
    min-height: 2.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .snake-stage-option,
  .snake-asset-button,
  .snake-fade-enter-active,
  .snake-fade-leave-active {
    transition: none;
  }
}
</style>
