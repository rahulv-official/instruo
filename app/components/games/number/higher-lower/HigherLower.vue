<script setup lang="ts">
type Direction = "higher" | "lower";
type ActualDirection = Direction | "equal";
type GamePhase = "loading" | "ready" | "playing" | "complete";

interface Round {
  from: number;
  to: number;
  prediction: Direction;
  actual: ActualDirection;
  correct: boolean;
}

const minNumber = 1;
const maxNumber = 100;

const phase = ref<GamePhase>("loading");
const current = ref(randomNumber());
const next = ref(randomNumber());
const score = ref(0);
const bestScore = ref(0);
const history = ref<Round[]>([]);
const lastRound = ref<Round | null>(null);
const loadingProgress = ref(14);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;

const isComplete = computed(() => phase.value === "complete");
const lastResult = computed(() => lastRound.value?.correct ?? null);
const statusText = computed(() => {
  if (phase.value === "loading") return "Preparing the stage";
  if (phase.value === "ready") return "Call the next number";
  if (isComplete.value) return "Round over";
  if (lastRound.value?.correct) return "Correct call";
  return "Will it be higher or lower?";
});
const statusTone = computed(() => {
  if (isComplete.value) return "error";
  if (lastResult.value) return "success";
  return "neutral";
});
const lastRoundText = computed(() => {
  const round = lastRound.value;
  if (!round) return "Make a call to reveal the next number.";
  if (round.actual === "equal")
    return `${round.to} matched ${round.from}. Equal numbers end the round.`;
  if (round.correct) return `${round.to} was ${round.actual}. Your call was right.`;
  return `${round.to} was ${round.actual}, not ${round.prediction}.`;
});
const resultTitle = computed(() =>
  lastRound.value?.actual === "equal" ? "Same number." : "That call missed.",
);
const resultIcon = computed(() =>
  lastRound.value?.actual === "equal" ? "i-tabler-equal" : "i-tabler-flag-3",
);

function randomNumber() {
  return minNumber + Math.floor(Math.random() * (maxNumber - minNumber + 1));
}

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function startGame() {
  current.value = randomNumber();
  next.value = randomNumber();
  score.value = 0;
  history.value = [];
  lastRound.value = null;
  phase.value = "playing";
}

function choose(prediction: Direction) {
  if (phase.value !== "playing") return;

  const from = current.value;
  const to = next.value;
  const actual: ActualDirection = to === from ? "equal" : to > from ? "higher" : "lower";
  const round: Round = {
    from,
    to,
    prediction,
    actual,
    correct: actual === prediction,
  };

  lastRound.value = round;
  history.value = [...history.value, round];

  if (!round.correct) {
    phase.value = "complete";
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      if (import.meta.client)
        localStorage.setItem("instruo-higher-lower-best", String(score.value));
    }
    return;
  }

  score.value += 1;
  current.value = to;
  next.value = randomNumber();
}

onMounted(() => {
  const savedBest = Number.parseInt(localStorage.getItem("instruo-higher-lower-best") ?? "0", 10);
  if (Number.isFinite(savedBest)) bestScore.value = savedBest;
  loadingTimer = setTimeout(finishLoading, 650);
});

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
  <ToolWorkbench
    description="Predict whether the next number is higher or lower. Equal numbers end the round."
  >
    <div class="higher-lower-game">
      <img
        src="/game-arts/higher-lower.jpg"
        alt="A fox game-show host points toward higher and lower number boards"
        class="higher-lower-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="higher-lower-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="higher-lower-state"
      >
        <div class="higher-lower-state-copy">
          <UIcon
            name="i-tabler-arrows-up-down"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="higher-lower-eyebrow">The number stage</p>
          <h2>Setting the next reveal</h2>
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
        class="higher-lower-state higher-lower-state--ready"
      >
        <div class="higher-lower-ready-copy">
          <UBadge
            label="1–100 · endless calls"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="higher-lower-eyebrow">Read the room · trust the odds</p>
          <h2>Call the next number.<br />Keep your streak alive.</h2>
          <p>
            Choose higher or lower, then watch the next card turn. One wrong call ends the round.
          </p>
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
        class="higher-lower-layout"
      >
        <aside class="higher-lower-intro">
          <p class="higher-lower-eyebrow">The prediction room</p>
          <h2>One card up.<br />One card down.</h2>
          <p>
            The closer the number gets to an edge, the more the odds change. Watch the range and
            make the next call count.
          </p>
        </aside>

        <section
          class="higher-lower-console"
          aria-label="Higher or Lower game"
        >
          <div
            class="higher-lower-console-body"
            :class="{ 'higher-lower-console-body--blurred': isComplete }"
          >
            <header class="higher-lower-header">
              <div>
                <p class="higher-lower-eyebrow">Higher or lower</p>
                <p
                  class="higher-lower-status"
                  :data-tone="statusTone"
                  role="status"
                  aria-live="polite"
                >
                  {{ statusText }}
                </p>
              </div>
              <div class="higher-lower-score">
                <span>Score</span>
                <strong>{{ score }}</strong>
                <small>Best {{ bestScore }}</small>
              </div>
            </header>

            <div class="higher-lower-current-card">
              <span class="higher-lower-card-label">Current number</span>
              <strong>{{ current }}</strong>
              <span class="higher-lower-card-range">Choose the direction of the next card</span>
            </div>

            <div
              class="higher-lower-reveal"
              :class="{ 'higher-lower-reveal--empty': !lastRound }"
              aria-live="polite"
            >
              <div>
                <span>Last reveal</span>
                <strong>{{ lastRound?.to ?? "—" }}</strong>
              </div>
              <p>{{ lastRoundText }}</p>
            </div>

            <div class="higher-lower-actions">
              <UButton
                label="Higher"
                icon="i-tabler-arrow-up"
                color="success"
                size="xl"
                :disabled="isComplete"
                @click="choose('higher')"
              />
              <UButton
                label="Lower"
                icon="i-tabler-arrow-down"
                color="primary"
                size="xl"
                :disabled="isComplete"
                @click="choose('lower')"
              />
            </div>

            <section
              class="higher-lower-history"
              aria-label="Prediction history"
            >
              <div class="higher-lower-history-heading">
                <h2>Recent calls</h2>
                <span>{{ history.length }} revealed</span>
              </div>
              <ol v-if="history.length">
                <li
                  v-for="(round, index) in [...history].reverse().slice(0, 5)"
                  :key="`${index}-${round.from}-${round.to}`"
                  :data-correct="round.correct"
                >
                  <span class="higher-lower-history-numbers"
                    >{{ round.from }} → {{ round.to }}</span
                  >
                  <span>{{ round.prediction }}</span>
                  <UIcon
                    :name="round.correct ? 'i-tabler-check' : 'i-tabler-x'"
                    aria-hidden="true"
                  />
                </li>
              </ol>
              <p
                v-else
                class="higher-lower-history-empty"
              >
                Your calls will appear here.
              </p>
            </section>

            <div class="higher-lower-footer">
              <p>Equal numbers end the round.</p>
              <UButton
                label="New round"
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
            class="higher-lower-result"
          >
            <UIcon
              :name="resultIcon"
              class="text-error size-9"
              aria-hidden="true"
            />
            <p class="higher-lower-eyebrow">Round complete</p>
            <h2>{{ resultTitle }}</h2>
            <p>
              The next number was <strong>{{ lastRound?.to }}</strong
              >. You scored <strong>{{ score }}</strong
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
.higher-lower-game {
  --higher-lower-accent: #fb923c;
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

.higher-lower-art,
.higher-lower-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.higher-lower-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.higher-lower-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.26) 44%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.24);
}

.higher-lower-state,
.higher-lower-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.higher-lower-state {
  display: grid;
  place-items: center;
  color: white;
  text-align: center;
}

.higher-lower-state-copy,
.higher-lower-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.higher-lower-state-copy h2,
.higher-lower-ready-copy h2,
.higher-lower-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.higher-lower-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.higher-lower-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.higher-lower-ready-copy > p:not(.higher-lower-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.higher-lower-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.higher-lower-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.higher-lower-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.higher-lower-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.higher-lower-console {
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

.higher-lower-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.higher-lower-header,
.higher-lower-history-heading,
.higher-lower-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.higher-lower-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.3rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.higher-lower-status[data-tone="success"] {
  color: #86efac;
}

.higher-lower-status[data-tone="error"] {
  color: #fca5a5;
}

.higher-lower-score {
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

.higher-lower-score strong {
  grid-row: span 2;
  color: white;
  font-size: 1.35rem;
}

.higher-lower-score small {
  grid-column: 1 / -1;
  color: rgb(255 255 255 / 0.4);
  font-size: 0.55rem;
}

.higher-lower-current-card {
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  padding: 1.4rem 1rem 1.25rem;
  border: 1px solid rgb(255 255 255 / 0.15);
  border-radius: 0.9rem;
  background: linear-gradient(145deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.035));
  box-shadow: inset 0 1px rgb(255 255 255 / 0.1);
}

.higher-lower-card-label,
.higher-lower-card-range {
  color: rgb(255 255 255 / 0.5);
  font-size: 0.68rem;
}

.higher-lower-current-card strong {
  color: white;
  font-family: var(--font-mono);
  font-size: clamp(3.4rem, 14cqw, 7rem);
  font-weight: 650;
  letter-spacing: -0.08em;
  line-height: 0.95;
}

.higher-lower-reveal {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
  min-height: 4.25rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.13);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.045);
}

.higher-lower-reveal > div {
  display: grid;
  justify-items: center;
  min-width: 3.2rem;
  padding-right: 0.8rem;
  border-right: 1px solid rgb(255 255 255 / 0.12);
}

.higher-lower-reveal span {
  color: rgb(255 255 255 / 0.45);
  font-size: 0.6rem;
  white-space: nowrap;
}

.higher-lower-reveal strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.35rem;
}

.higher-lower-reveal p {
  margin: 0;
  color: rgb(255 255 255 / 0.68);
  font-size: 0.72rem;
  line-height: 1.4;
}

.higher-lower-reveal--empty {
  visibility: hidden;
}

.higher-lower-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.higher-lower-actions :deep(button) {
  min-height: 3.25rem;
}

.higher-lower-history {
  display: grid;
  gap: 0.55rem;
}

.higher-lower-history-heading {
  align-items: center;
}

.higher-lower-history-heading h2 {
  margin: 0;
  color: rgb(255 255 255 / 0.76);
  font-size: 0.8rem;
  font-weight: 600;
}

.higher-lower-history-heading span,
.higher-lower-history-empty {
  color: rgb(255 255 255 / 0.4);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.higher-lower-history ol {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.higher-lower-history li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.55rem;
  color: rgb(255 255 255 / 0.58);
  font-size: 0.65rem;
  text-transform: capitalize;
}

.higher-lower-history li[data-correct="true"] {
  border-color: rgb(134 239 172 / 0.35);
  color: #86efac;
}

.higher-lower-history li[data-correct="false"] {
  border-color: rgb(248 113 113 / 0.35);
  color: #fca5a5;
}

.higher-lower-history-numbers {
  color: white;
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.higher-lower-history li .iconify {
  margin-left: auto;
}

.higher-lower-history-empty {
  margin: 0;
}

.higher-lower-footer {
  align-items: center;
  padding-top: 0.2rem;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.higher-lower-footer p {
  margin: 0;
  color: rgb(255 255 255 / 0.42);
  font-size: 0.65rem;
}

.higher-lower-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.higher-lower-result {
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

.higher-lower-result p:not(.higher-lower-eyebrow) {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
}

.higher-lower-result strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.25rem;
}

@container (min-width: 48rem) {
  .higher-lower-game {
    min-height: 36rem;
  }

  .higher-lower-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }

  .higher-lower-intro {
    display: block;
  }

  .higher-lower-console-body {
    gap: 1.2rem;
    padding: 1.4rem;
  }

  .higher-lower-header,
  .higher-lower-current-card,
  .higher-lower-reveal,
  .higher-lower-actions,
  .higher-lower-history,
  .higher-lower-footer {
    grid-column: 1 / -1;
  }

  .higher-lower-current-card {
    padding-block: 1.7rem;
  }

  .higher-lower-actions {
    max-width: 30rem;
    justify-self: center;
    width: 100%;
  }
}

@container (min-width: 72rem) {
  .higher-lower-layout {
    gap: 3rem;
    padding: 2.5rem;
  }

  .higher-lower-console-body {
    gap: 1.4rem;
    padding: 1.7rem;
  }

  .higher-lower-console {
    border-radius: 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .higher-lower-console,
  .higher-lower-actions button,
  .higher-lower-history li {
    transition: none;
  }
}
</style>
