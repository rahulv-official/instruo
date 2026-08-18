<script setup lang="ts">
type GamePhase = "loading" | "ready" | "playing" | "complete";
type FeedbackTone = "neutral" | "success" | "error";

const maxAttempts = 3;
const phase = ref<GamePhase>("loading");
const numbers = ref<number[]>([]);
const target = ref(0);
const solution = ref<number[]>([]);
const selected = ref<number[]>([]);
const attempts = ref(0);
const score = ref(0);
const bestScore = ref(0);
const lastSum = ref<number | null>(null);
const feedback = ref("Choose two tiles to hit the target.");
const feedbackTone = ref<FeedbackTone>("neutral");
const loadingProgress = ref(14);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;

const isComplete = computed(() => phase.value === "complete");
const selectedTotal = computed(() =>
  selected.value.reduce((sum, index) => sum + (numbers.value[index] ?? 0), 0),
);
const attemptsLeft = computed(() => maxAttempts - attempts.value);
const resultTitle = computed(() =>
  feedbackTone.value === "success" ? "Bullseye." : "Keep aiming.",
);
const resultIcon = computed(() =>
  feedbackTone.value === "success" ? "i-tabler-target-arrow" : "i-tabler-refresh-alert",
);
const resultDescription = computed(() => {
  if (feedbackTone.value === "success")
    return `You found ${target.value} in ${attempts.value} attempt${attempts.value === 1 ? "" : "s"}.`;
  return `The target was ${target.value}. A matching pair was ${solution.value.join(" + ")}.`;
});

function randomNumber(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(values: number[]) {
  return [...values].sort(() => Math.random() - 0.5);
}

function createRound() {
  const first = randomNumber(2, 12);
  const second = randomNumber(2, 12);
  const distractors = Array.from({ length: 4 }, () => randomNumber(1, 18));
  numbers.value = shuffle([first, second, ...distractors]);
  target.value = first + second;
  solution.value = [first, second];
  selected.value = [];
  attempts.value = 0;
  lastSum.value = null;
  feedback.value = "Choose two tiles to hit the target.";
  feedbackTone.value = "neutral";
}

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function startGame() {
  createRound();
  phase.value = "playing";
}

function evaluate(nextSelection: number[]) {
  const sum = nextSelection.reduce((total, index) => total + (numbers.value[index] ?? 0), 0);
  attempts.value += 1;
  lastSum.value = sum;

  if (sum === target.value) {
    score.value += 1;
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      if (import.meta.client) localStorage.setItem("instruo-target-sum-best", String(score.value));
    }
    feedback.value = `${sum} is exactly the target.`;
    feedbackTone.value = "success";
    phase.value = "complete";
    return;
  }

  feedbackTone.value = "error";
  feedback.value = `${sum} is ${sum > target.value ? "too high" : "too low"}. Try a different pair.`;
  if (attempts.value >= maxAttempts) phase.value = "complete";
}

function choose(index: number) {
  if (phase.value !== "playing") return;

  if (selected.value.includes(index)) {
    selected.value = selected.value.filter((item) => item !== index);
    feedbackTone.value = "neutral";
    feedback.value = "Choose two tiles to hit the target.";
    return;
  }

  const nextSelection =
    selected.value.length >= 2 ? [selected.value[1]!, index] : [...selected.value, index];
  selected.value = nextSelection;
  if (nextSelection.length === 2) evaluate(nextSelection);
}

onMounted(() => {
  const savedBest = Number.parseInt(localStorage.getItem("instruo-target-sum-best") ?? "0", 10);
  if (Number.isFinite(savedBest)) bestScore.value = savedBest;
  loadingTimer = setTimeout(finishLoading, 650);
});

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
  <ToolWorkbench description="Choose exactly two number tiles whose values add up to the target.">
    <div class="target-sum-game">
      <img
        src="/game-arts/target-sum.jpg"
        alt="A cheerful target game with colorful numbered balls"
        class="target-sum-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="target-sum-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="target-sum-state"
      >
        <div class="target-sum-state-copy">
          <UIcon
            name="i-tabler-target-arrow"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="target-sum-eyebrow">The number carnival</p>
          <h2>Setting the target</h2>
          <UProgress
            :model-value="loadingProgress"
            color="primary"
            class="w-48"
            aria-label="Loading game"
          />
        </div>
      </div>

      <div
        v-else-if="phase === 'ready'"
        class="target-sum-state target-sum-state--ready"
      >
        <div class="target-sum-ready-copy">
          <UBadge
            label="6 tiles · 3 attempts"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="target-sum-eyebrow">Aim · add · hit the mark</p>
          <h2>Find the pair.<br />Hit the target.</h2>
          <p>Choose two tiles whose values add up exactly. Swap a tile anytime before you check.</p>
          <UButton
            label="Start game"
            icon="i-tabler-player-play"
            color="primary"
            size="lg"
            @click="startGame"
          />
        </div>
      </div>

      <div
        v-else
        class="target-sum-layout"
      >
        <aside class="target-sum-intro">
          <p class="target-sum-eyebrow">The target range</p>
          <h2>Small numbers.<br />Sharp aim.</h2>
          <p>Start with the target, then pair the tiles that get you there without going over.</p>
        </aside>

        <section
          class="target-sum-console"
          aria-label="Target Sum game"
        >
          <div
            class="target-sum-console-body"
            :class="{ 'target-sum-console-body--blurred': isComplete }"
          >
            <header class="target-sum-header">
              <div>
                <p class="target-sum-eyebrow">Target sum</p>
                <p
                  class="target-sum-status"
                  :data-tone="feedbackTone"
                  role="status"
                  aria-live="polite"
                >
                  {{ feedback }}
                </p>
              </div>
              <div class="target-sum-score">
                <span>Score</span>
                <strong>{{ score }}</strong>
                <small>Best {{ bestScore }}</small>
              </div>
            </header>

            <div class="target-sum-target-card">
              <span>Target</span>
              <strong>{{ target }}</strong>
              <small>Pick two numbers</small>
            </div>

            <div
              class="target-sum-selection"
              :data-invalid="feedbackTone === 'error'"
            >
              <div class="target-sum-selection-label">
                <span>Your pair</span>
                <strong
                  >{{ selectedTotal }} <small>/ {{ target }}</small></strong
                >
              </div>
              <div class="target-sum-selection-track">
                <span
                  :style="{
                    width: `${Math.min((selectedTotal / Math.max(target, 1)) * 100, 100)}%`,
                  }"
                />
              </div>
              <p>
                {{
                  selected.length === 2
                    ? `Attempt ${attempts} of ${maxAttempts}`
                    : `${selected.length}/2 selected`
                }}
              </p>
            </div>

            <div
              class="target-sum-tiles"
              role="group"
              aria-label="Number tiles"
            >
              <button
                v-for="(number, index) in numbers"
                :key="`${number}-${index}`"
                type="button"
                class="target-sum-tile"
                :class="{
                  'target-sum-tile--selected': selected.includes(index),
                  'target-sum-tile--correct':
                    isComplete && feedbackTone === 'success' && selected.includes(index),
                  'target-sum-tile--wrong': feedbackTone === 'error' && selected.includes(index),
                }"
                :disabled="isComplete"
                :aria-pressed="selected.includes(index)"
                @click="choose(index)"
              >
                <span>{{ number }}</span>
                <UIcon
                  v-if="selected.includes(index)"
                  name="i-tabler-check"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div class="target-sum-footer">
              <p>{{ attemptsLeft }} attempt{{ attemptsLeft === 1 ? "" : "s" }} left</p>
              <UButton
                label="New target"
                icon="i-tabler-refresh"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="startGame"
              />
            </div>
          </div>

          <div
            v-if="isComplete"
            class="target-sum-result"
          >
            <UIcon
              :name="resultIcon"
              :class="feedbackTone === 'success' ? 'text-success' : 'text-error'"
              class="size-9"
              aria-hidden="true"
            />
            <p class="target-sum-eyebrow">Round complete</p>
            <h2>{{ resultTitle }}</h2>
            <p>{{ resultDescription }}</p>
            <UButton
              label="Play again"
              icon="i-tabler-player-play"
              color="primary"
              @click="startGame"
            />
          </div>
        </section>
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.target-sum-game {
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  min-height: 42rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 1.25rem;
  background: #0b0d12;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.28);
}

.target-sum-art,
.target-sum-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.target-sum-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.target-sum-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.38), rgb(0 0 0 / 0.24) 44%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.2);
}

.target-sum-state,
.target-sum-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.target-sum-state {
  display: grid;
  place-items: center;
  color: white;
  text-align: center;
}

.target-sum-state-copy,
.target-sum-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.target-sum-state-copy h2,
.target-sum-ready-copy h2,
.target-sum-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.target-sum-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.target-sum-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.target-sum-ready-copy > p:not(.target-sum-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.target-sum-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.target-sum-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.target-sum-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.target-sum-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.target-sum-console {
  position: relative;
  min-width: 0;
  align-self: center;
  border: 1px solid rgb(254 215 170 / 0.25);
  border-radius: 1rem;
  background: rgb(0 0 0 / 0.75);
  color: white;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(4px);
}

.target-sum-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.target-sum-header,
.target-sum-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.target-sum-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.1rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.target-sum-status[data-tone="success"] {
  color: #86efac;
}

.target-sum-status[data-tone="error"] {
  color: #fca5a5;
}

.target-sum-score {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 0.25rem 0.55rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.55);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.target-sum-score strong {
  grid-row: span 2;
  color: white;
  font-size: 1.35rem;
}

.target-sum-score small {
  grid-column: 1 / -1;
  color: rgb(255 255 255 / 0.4);
  font-size: 0.55rem;
}

.target-sum-target-card {
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  padding: 1.15rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.15);
  border-radius: 0.9rem;
  background: linear-gradient(145deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.035));
  box-shadow: inset 0 1px rgb(255 255 255 / 0.1);
}

.target-sum-target-card span,
.target-sum-target-card small {
  color: rgb(255 255 255 / 0.5);
  font-size: 0.68rem;
}

.target-sum-target-card strong {
  color: #fde68a;
  font-family: var(--font-mono);
  font-size: clamp(3.4rem, 13cqw, 6rem);
  font-weight: 650;
  letter-spacing: -0.08em;
  line-height: 0.95;
  text-shadow: 0 0 24px rgb(253 230 138 / 0.24);
}

.target-sum-selection {
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.13);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.045);
}

.target-sum-selection[data-invalid="true"] {
  border-color: rgb(248 113 113 / 0.38);
}

.target-sum-selection-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: rgb(255 255 255 / 0.54);
  font-size: 0.68rem;
}

.target-sum-selection-label strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.1rem;
}

.target-sum-selection-label small {
  color: rgb(255 255 255 / 0.4);
  font-size: 0.65rem;
}

.target-sum-selection-track {
  height: 0.35rem;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.1);
}

.target-sum-selection-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #fde68a;
  transition: width 180ms ease-out;
}

.target-sum-selection[data-invalid="true"] .target-sum-selection-track span {
  background: #fca5a5;
}

.target-sum-selection p {
  margin: 0;
  color: rgb(255 255 255 / 0.4);
  font-family: var(--font-mono);
  font-size: 0.6rem;
}

.target-sum-tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.target-sum-tile {
  position: relative;
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  min-width: 0;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 0.8rem;
  background: linear-gradient(145deg, rgb(96 165 250 / 0.35), rgb(30 64 175 / 0.28));
  color: white;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: clamp(1.8rem, 7cqw, 3.5rem);
  font-weight: 650;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.target-sum-tile:nth-child(3n + 2) {
  background: linear-gradient(145deg, rgb(251 146 60 / 0.38), rgb(154 52 18 / 0.28));
}

.target-sum-tile:nth-child(3n) {
  background: linear-gradient(145deg, rgb(192 132 252 / 0.38), rgb(107 33 168 / 0.28));
}

.target-sum-tile:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 0.45);
  transform: translateY(-2px);
}

.target-sum-tile:active:not(:disabled) {
  transform: translateY(1px);
}

.target-sum-tile:focus-visible {
  outline: 2px solid #fde68a;
  outline-offset: 2px;
}

.target-sum-tile--selected {
  border-color: #fde68a;
  background: rgb(253 230 138 / 0.28) !important;
  box-shadow:
    0 0 0 2px rgb(253 230 138 / 0.2),
    0 0 24px rgb(253 230 138 / 0.2);
}

.target-sum-tile--wrong {
  border-color: #fca5a5;
  background: rgb(248 113 113 / 0.2) !important;
}

.target-sum-tile--correct {
  border-color: #86efac;
  background: rgb(134 239 172 / 0.2) !important;
}

.target-sum-tile .iconify {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 1rem;
  height: 1rem;
  color: #fde68a;
}

.target-sum-footer {
  align-items: center;
  padding-top: 0.2rem;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.target-sum-footer p {
  margin: 0;
  color: rgb(255 255 255 / 0.42);
  font-size: 0.65rem;
}

.target-sum-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.target-sum-result {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.7rem;
  padding: 1.5rem;
  border-radius: inherit;
  background: rgb(0 0 0 / 0.68);
  color: white;
  text-align: center;
  backdrop-filter: blur(12px);
}

.target-sum-result p:not(.target-sum-eyebrow) {
  margin: 0;
  max-width: 24rem;
  color: rgb(255 255 255 / 0.72);
}

@container (min-width: 48rem) {
  .target-sum-game {
    min-height: 36rem;
  }

  .target-sum-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }

  .target-sum-intro {
    display: block;
  }

  .target-sum-console-body {
    gap: 1.2rem;
    padding: 1.4rem;
  }

  .target-sum-header,
  .target-sum-target-card,
  .target-sum-selection,
  .target-sum-tiles,
  .target-sum-footer {
    grid-column: 1 / -1;
  }

  .target-sum-tiles {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@container (min-width: 72rem) {
  .target-sum-layout {
    gap: 3rem;
    padding: 2.5rem;
  }

  .target-sum-console-body {
    gap: 1.4rem;
    padding: 1.7rem;
  }

  .target-sum-console {
    border-radius: 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .target-sum-selection-track span,
  .target-sum-tile {
    transition: none;
  }
}
</style>
