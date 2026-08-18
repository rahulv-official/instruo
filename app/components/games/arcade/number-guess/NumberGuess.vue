<script setup lang="ts">
type GuessDirection = "higher" | "lower" | "correct";
type GamePhase = "loading" | "ready" | "playing" | "won" | "lost";

interface GuessRecord {
  value: number;
  direction: GuessDirection;
}

const minNumber = 1;
const maxNumber = 100;
const maxAttempts = 7;
const phase = ref<GamePhase>("loading");
const target = ref(randomTarget());
const guess = ref<number | undefined>();
const history = ref<GuessRecord[]>([]);
const feedback = ref<"ready" | "higher" | "lower" | "correct" | "invalid">("ready");
const loadingProgress = ref(16);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;

const attempts = computed(() => history.value.length);
const guessesLeft = computed(() => maxAttempts - attempts.value);
const finished = computed(() => phase.value === "won" || phase.value === "lost");
const won = computed(() => phase.value === "won");
const lowerBound = computed(() => {
  const lowerHints = history.value
    .filter((item) => item.direction === "higher")
    .map((item) => item.value + 1);
  return Math.max(minNumber, ...lowerHints);
});
const upperBound = computed(() => {
  const upperHints = history.value
    .filter((item) => item.direction === "lower")
    .map((item) => item.value - 1);
  return Math.min(maxNumber, ...upperHints);
});
const rangeStart = computed(() => `${((lowerBound.value - minNumber) / 99) * 100}%`);
const rangeEnd = computed(() => `${((upperBound.value - minNumber) / 99) * 100}%`);
const lastGuess = computed(() => history.value.at(-1));
const statusText = computed(() => {
  if (feedback.value === "higher") return "Higher";
  if (feedback.value === "lower") return "Lower";
  if (feedback.value === "correct") return "Correct";
  if (feedback.value === "invalid") return `Enter ${minNumber}–${maxNumber}`;
  return "Pick a number";
});
const statusTone = computed(() => {
  if (feedback.value === "correct") return "success";
  if (feedback.value === "invalid") return "error";
  if (feedback.value === "higher" || feedback.value === "lower") return "primary";
  return "neutral";
});

function randomTarget() {
  return minNumber + Math.floor(Math.random() * (maxNumber - minNumber + 1));
}

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function startGame() {
  target.value = randomTarget();
  guess.value = undefined;
  history.value = [];
  feedback.value = "ready";
  phase.value = "playing";
}

function submit() {
  const submittedGuess = guess.value;
  if (phase.value !== "playing" || submittedGuess === undefined || submittedGuess === null) {
    feedback.value = "invalid";
    return;
  }

  if (
    !Number.isInteger(submittedGuess) ||
    submittedGuess < minNumber ||
    submittedGuess > maxNumber
  ) {
    feedback.value = "invalid";
    return;
  }

  const direction: GuessDirection =
    submittedGuess === target.value
      ? "correct"
      : submittedGuess < target.value
        ? "higher"
        : "lower";
  history.value = [...history.value, { value: submittedGuess, direction }];
  guess.value = undefined;
  feedback.value = direction;

  if (direction === "correct") phase.value = "won";
  else if (history.value.length >= maxAttempts) phase.value = "lost";
}

onMounted(() => {
  loadingTimer = setTimeout(finishLoading, 600);
});

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
  <ToolWorkbench
    description="Find the hidden number in seven guesses. Every result narrows the search."
  >
    <div class="number-guess-game">
      <img
        src="/game-arts/number-guess.jpg"
        alt="A playful number guessing scene with a glowing target and numbered tiles"
        class="number-guess-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="number-guess-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="number-guess-state"
      >
        <div class="number-guess-state-card">
          <UIcon
            name="i-tabler-target-arrow"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="number-guess-eyebrow">Signal room</p>
          <h2>Finding a fair number</h2>
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
        class="number-guess-state number-guess-state--ready"
      >
        <div class="number-guess-ready-copy">
          <UBadge
            label="Range 01–100"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="number-guess-eyebrow">Seven attempts · one target</p>
          <h2>Read the signal.<br />Find the number.</h2>
          <p>Every guess tightens the range. Use the clues and make each attempt count.</p>
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
        class="number-guess-layout"
      >
        <aside class="number-guess-intro">
          <p class="number-guess-eyebrow">Signal protocol</p>
          <h2>Small range.<br />Sharp guesses.</h2>
          <p>
            A higher or lower clue never changes. Keep the shrinking range in view and spend your
            guesses deliberately.
          </p>
        </aside>

        <section
          class="number-guess-console"
          :class="{ 'number-guess-console--done': finished }"
          aria-label="Number Guess game"
        >
          <div
            class="number-guess-console-body"
            :class="{ 'number-guess-console-body--blurred': finished }"
          >
            <header class="number-guess-header">
              <div>
                <p class="number-guess-eyebrow">Number guess</p>
                <p
                  class="number-guess-status"
                  :data-tone="statusTone"
                  role="status"
                  aria-live="polite"
                >
                  {{ statusText }}
                </p>
              </div>
              <UBadge
                :label="`${guessesLeft}/${maxAttempts}`"
                color="neutral"
                variant="subtle"
                class="number-guess-count"
                :aria-label="`${guessesLeft} guesses left`"
              />
            </header>

            <div class="number-guess-stats">
              <div class="number-guess-stat number-guess-stat--range">
                <span>Possible range</span>
                <strong>{{ lowerBound }}–{{ upperBound }}</strong>
                <div
                  class="number-guess-track"
                  role="img"
                  :aria-label="`Possible numbers from ${lowerBound} to ${upperBound}`"
                >
                  <span
                    class="number-guess-track-active"
                    :style="{ left: rangeStart, right: `${100 - Number.parseFloat(rangeEnd)}%` }"
                  />
                </div>
                <div class="number-guess-track-labels"><span>1</span><span>100</span></div>
              </div>
              <div class="number-guess-stat number-guess-stat--attempts">
                <span>Guesses left</span>
                <strong>{{ guessesLeft }}</strong>
                <small>of {{ maxAttempts }}</small>
              </div>
            </div>

            <form
              class="number-guess-form"
              @submit.prevent="submit"
            >
              <UFormField
                label="Your guess"
                :description="`Whole number from ${minNumber} to ${maxNumber}`"
                class="number-guess-field"
              >
                <UInput
                  v-model.number="guess"
                  type="number"
                  :min="minNumber"
                  :max="maxNumber"
                  :disabled="finished"
                  size="xl"
                  class="number-guess-input"
                  inputmode="numeric"
                  placeholder="42"
                />
              </UFormField>
              <div class="number-guess-actions">
                <UButton
                  type="submit"
                  label="Check guess"
                  icon="i-tabler-arrow-right"
                  color="primary"
                  size="lg"
                  :disabled="finished || guess === undefined || guess === null"
                />
                <UButton
                  type="button"
                  label="New number"
                  icon="i-tabler-refresh"
                  color="neutral"
                  variant="outline"
                  size="lg"
                  @click="startGame"
                />
              </div>
            </form>

            <div
              v-if="lastGuess"
              class="number-guess-last"
              :data-direction="lastGuess.direction"
              aria-live="polite"
            >
              <span>Last guess</span>
              <strong>{{ lastGuess.value }}</strong>
              <span class="number-guess-last-result">
                <UIcon
                  :name="
                    lastGuess.direction === 'correct'
                      ? 'i-tabler-check'
                      : lastGuess.direction === 'higher'
                        ? 'i-tabler-arrow-up'
                        : 'i-tabler-arrow-down'
                  "
                  aria-hidden="true"
                />
                {{ lastGuess.direction === "correct" ? "Correct" : lastGuess.direction }}
              </span>
            </div>

            <section
              v-if="history.length"
              class="number-guess-history"
              aria-label="Guess history"
            >
              <div class="number-guess-history-heading">
                <h2>Guess history</h2>
                <span>{{ attempts }}/{{ maxAttempts }} used</span>
              </div>
              <ol>
                <li
                  v-for="(item, index) in [...history].reverse()"
                  :key="`${index}-${item.value}-${item.direction}`"
                  :data-direction="item.direction"
                >
                  <span class="number-guess-history-number">{{ item.value }}</span>
                  <span>{{ item.direction === "correct" ? "Correct" : item.direction }}</span>
                  <UIcon
                    :name="
                      item.direction === 'correct'
                        ? 'i-tabler-check'
                        : item.direction === 'higher'
                          ? 'i-tabler-arrow-up'
                          : 'i-tabler-arrow-down'
                    "
                    aria-hidden="true"
                  />
                </li>
              </ol>
            </section>

            <p class="number-guess-hint">Enter submits · every valid guess uses one attempt</p>
          </div>

          <div
            v-if="finished"
            class="number-guess-result"
          >
            <UIcon
              :name="won ? 'i-tabler-trophy' : 'i-tabler-flag-3'"
              class="text-primary size-9"
              aria-hidden="true"
            />
            <p class="number-guess-eyebrow">{{ won ? "Target found" : "Signal lost" }}</p>
            <h2>{{ won ? "Nice work." : "Out of tries." }}</h2>
            <p>
              The number was <strong>{{ target }}</strong
              >.
            </p>
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
.number-guess-game {
  --number-guess-accent: #fb923c;
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

.number-guess-art,
.number-guess-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.number-guess-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.number-guess-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.3) 46%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.22);
}

.number-guess-state,
.number-guess-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.number-guess-state {
  display: grid;
  place-items: center;
  text-align: center;
  color: white;
}

.number-guess-state-card,
.number-guess-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.number-guess-state-card h2,
.number-guess-ready-copy h2,
.number-guess-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.number-guess-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.number-guess-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.number-guess-ready-copy > p:not(.number-guess-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.number-guess-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.number-guess-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.number-guess-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.number-guess-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.number-guess-console {
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

.number-guess-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.number-guess-header,
.number-guess-history-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.number-guess-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.number-guess-status[data-tone="success"] {
  color: #86efac;
}
.number-guess-status[data-tone="error"] {
  color: #fca5a5;
}
.number-guess-status[data-tone="primary"] {
  color: #fdba74;
}
.number-guess-count {
  background: rgb(255 255 255 / 0.1);
  color: white;
}

.number-guess-stats {
  display: grid;
  gap: 0.65rem;
}

.number-guess-stat {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.13);
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 0.055);
}

.number-guess-stat > span,
.number-guess-stat > small {
  color: rgb(255 255 255 / 0.55);
  font-size: 0.68rem;
}

.number-guess-stat strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.65rem;
  font-weight: 600;
  letter-spacing: -0.04em;
}

.number-guess-stat--attempts strong {
  font-size: 2.2rem;
}
.number-guess-track {
  position: relative;
  height: 0.45rem;
  margin-top: 0.4rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.1);
}
.number-guess-track-active {
  position: absolute;
  inset-block: 0;
  border-radius: inherit;
  background: var(--number-guess-accent);
  box-shadow: 0 0 12px rgb(251 146 60 / 0.3);
}
.number-guess-track-labels {
  display: flex;
  justify-content: space-between;
  color: rgb(255 255 255 / 0.35);
  font-family: var(--font-mono);
  font-size: 0.58rem;
}

.number-guess-form {
  display: grid;
  gap: 0.8rem;
}
.number-guess-field :deep(input) {
  font-family: var(--font-mono);
  font-size: 1.25rem;
}
.number-guess-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.number-guess-last {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.7rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.13);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.045);
  color: rgb(255 255 255 / 0.58);
  font-size: 0.75rem;
}

.number-guess-last strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.25rem;
}
.number-guess-last-result {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #fdba74;
  text-transform: capitalize;
}
.number-guess-last[data-direction="correct"] .number-guess-last-result {
  color: #86efac;
}

.number-guess-history {
  display: grid;
  gap: 0.55rem;
}
.number-guess-history-heading h2 {
  margin: 0;
  color: rgb(255 255 255 / 0.76);
  font-size: 0.8rem;
  font-weight: 600;
}
.number-guess-history-heading span {
  color: rgb(255 255 255 / 0.4);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}
.number-guess-history ol {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.number-guess-history li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.55rem;
  color: rgb(255 255 255 / 0.58);
  font-size: 0.68rem;
}
.number-guess-history-number {
  color: white;
  font-family: var(--font-mono);
  font-size: 0.78rem;
}
.number-guess-history li .iconify {
  margin-left: auto;
}
.number-guess-history li[data-direction="correct"] {
  border-color: rgb(134 239 172 / 0.35);
  color: #86efac;
}
.number-guess-history li[data-direction="higher"],
.number-guess-history li[data-direction="lower"] {
  color: #fdba74;
}
.number-guess-hint {
  margin: 0;
  color: rgb(255 255 255 / 0.38);
  font-size: 0.68rem;
}

.number-guess-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.number-guess-result {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.7rem;
  padding: 1.5rem;
  border-radius: inherit;
  background: rgb(0 0 0 / 0.65);
  color: white;
  text-align: center;
  backdrop-filter: blur(12px);
}

.number-guess-result p:not(.number-guess-eyebrow) {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
}
.number-guess-result strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.25rem;
}

@container (min-width: 48rem) {
  .number-guess-game {
    min-height: 36rem;
  }
  .number-guess-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }
  .number-guess-intro {
    display: block;
  }
  .number-guess-console-body {
    grid-template-columns: minmax(0, 1.1fr) minmax(15rem, 0.9fr);
    gap: 1.2rem 1.4rem;
    padding: 1.4rem;
  }
  .number-guess-header {
    grid-column: 1 / -1;
  }
  .number-guess-stats {
    grid-column: 1;
    grid-row: 2;
    grid-template-columns: minmax(0, 1fr) 8.5rem;
  }
  .number-guess-form {
    grid-column: 2;
    grid-row: 2 / span 3;
    align-content: start;
    padding-left: 1.4rem;
    border-left: 1px solid rgb(255 255 255 / 0.13);
  }
  .number-guess-last {
    grid-column: 1;
    grid-row: 3;
  }
  .number-guess-history {
    grid-column: 1;
    grid-row: 4;
  }
  .number-guess-hint {
    grid-column: 1 / -1;
  }
}

@container (min-width: 72rem) {
  .number-guess-layout {
    gap: 3rem;
    padding: 2.5rem;
  }
  .number-guess-console-body {
    gap: 1.4rem 1.8rem;
    padding: 1.7rem;
  }
  .number-guess-console {
    border-radius: 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .number-guess-console,
  .number-guess-actions button,
  .number-guess-history li {
    transition: none;
  }
}
</style>
