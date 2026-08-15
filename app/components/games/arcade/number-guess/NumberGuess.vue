<script setup lang="ts">
type GuessDirection = "higher" | "lower" | "correct";

interface GuessRecord {
  value: number;
  direction: GuessDirection;
}

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const MAX_ATTEMPTS = 7;

const target = ref(randomTarget());
const guess = ref<number | undefined>();
const attempts = ref(0);
const finished = ref(false);
const won = ref(false);
const feedback = ref("Pick a number from 1 to 100.");
const history = ref<GuessRecord[]>([]);

function randomTarget() {
  return MIN_NUMBER + Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1));
}

const guessesLeft = computed(() => MAX_ATTEMPTS - attempts.value);
const lowerBound = computed(() => {
  const higherGuesses = history.value
    .filter((item) => item.direction === "higher")
    .map((item) => item.value + 1);

  return Math.max(MIN_NUMBER, ...higherGuesses);
});
const upperBound = computed(() => {
  const lowerGuesses = history.value
    .filter((item) => item.direction === "lower")
    .map((item) => item.value - 1);

  return Math.min(MAX_NUMBER, ...lowerGuesses);
});
const statusText = computed(() =>
  finished.value
    ? won.value
      ? `Correct. The number was ${target.value}.`
      : `Out of tries. The number was ${target.value}.`
    : feedback.value,
);
const feedbackClass = computed(() =>
  finished.value ? (won.value ? "text-success" : "text-error") : "text-highlighted",
);

function submit() {
  const submittedGuess = guess.value;

  if (finished.value || submittedGuess === undefined) return;

  if (
    !Number.isInteger(submittedGuess) ||
    submittedGuess < MIN_NUMBER ||
    submittedGuess > MAX_NUMBER
  ) {
    feedback.value = `Enter a whole number from ${MIN_NUMBER} to ${MAX_NUMBER}.`;
    return;
  }

  attempts.value += 1;

  const direction: GuessDirection =
    submittedGuess === target.value
      ? "correct"
      : submittedGuess < target.value
        ? "higher"
        : "lower";
  history.value.push({ value: submittedGuess, direction });
  guess.value = undefined;

  if (direction === "correct") {
    won.value = true;
    finished.value = true;
    return;
  }

  if (attempts.value >= MAX_ATTEMPTS) {
    finished.value = true;
    return;
  }

  feedback.value = direction === "higher" ? "Higher." : "Lower.";
}

function reset() {
  target.value = randomTarget();
  guess.value = undefined;
  attempts.value = 0;
  finished.value = false;
  won.value = false;
  feedback.value = `Pick a number from ${MIN_NUMBER} to ${MAX_NUMBER}.`;
  history.value = [];
}
</script>

<template>
  <ToolWorkbench
    description="Find the hidden number in seven guesses. Each answer narrows your range."
  >
    <form
      class="mx-auto grid max-w-2xl gap-6"
      @submit.prevent="submit"
    >
      <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-stretch">
        <div class="border-default/70 bg-muted/20 rounded-lg border p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-muted text-xs font-medium tracking-[0.16em] uppercase">Current clue</p>
              <p
                class="guess-feedback mt-2 text-xl font-semibold sm:text-2xl"
                :class="feedbackClass"
                role="status"
                aria-live="polite"
              >
                {{ statusText }}
              </p>
            </div>
            <UIcon
              :name="
                finished ? (won ? 'i-tabler-trophy' : 'i-tabler-flag-3') : 'i-tabler-target-arrow'
              "
              class="text-primary size-7 shrink-0"
              aria-hidden="true"
            />
          </div>
          <div class="mt-5 grid gap-2">
            <div class="text-muted flex items-center justify-between gap-3 text-xs">
              <span>Possible range</span>
              <span class="font-mono tabular-nums">{{ lowerBound }}–{{ upperBound }}</span>
            </div>
            <div
              class="bg-muted h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Guesses used"
              :aria-valuenow="attempts"
              aria-valuemin="0"
              :aria-valuemax="MAX_ATTEMPTS"
            >
              <div
                class="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
                :style="{ width: `${(attempts / MAX_ATTEMPTS) * 100}%` }"
              />
            </div>
          </div>
        </div>

        <div
          class="border-default/70 bg-elevated grid min-w-32 content-center justify-items-center rounded-lg border px-5 py-4 text-center"
        >
          <span class="text-muted text-xs font-medium tracking-[0.14em] uppercase"
            >Guesses left</span
          >
          <strong class="text-highlighted mt-1 font-mono text-4xl font-semibold tabular-nums">{{
            guessesLeft
          }}</strong>
          <span class="text-muted text-xs">of {{ MAX_ATTEMPTS }}</span>
        </div>
      </div>

      <UFormField
        label="Your guess"
        description="Whole number between 1 and 100. Your entry clears after each valid guess."
      >
        <UInput
          v-model.number="guess"
          type="number"
          :min="MIN_NUMBER"
          :max="MAX_NUMBER"
          :disabled="finished"
          size="xl"
          class="w-full"
          inputmode="numeric"
          placeholder="42"
        />
      </UFormField>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <span class="text-muted font-mono text-sm tabular-nums"
          >{{ attempts }}/{{ MAX_ATTEMPTS }} guesses used</span
        >
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            type="submit"
            label="Check guess"
            icon="i-tabler-arrow-right"
            size="lg"
            :disabled="finished || guess === undefined"
          />
          <UButton
            type="button"
            label="New number"
            color="neutral"
            variant="outline"
            icon="i-tabler-refresh"
            size="lg"
            @click="reset"
          />
        </div>
      </div>

      <section
        v-if="history.length"
        class="border-default/70 bg-muted/15 rounded-lg border p-4 sm:p-5"
        aria-label="Guess history"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-highlighted text-sm font-semibold">Guess history</h2>
          <span class="text-muted text-xs">Newest first</span>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="(item, index) in [...history].reverse()"
            :key="`${index}-${item.value}-${item.direction}`"
            class="bg-elevated ring-muted inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm tabular-nums ring-1"
          >
            <span>{{ item.value }}</span>
            <UIcon
              :name="
                item.direction === 'correct'
                  ? 'i-tabler-check'
                  : item.direction === 'higher'
                    ? 'i-tabler-arrow-up'
                    : 'i-tabler-arrow-down'
              "
              :class="item.direction === 'correct' ? 'text-success' : 'text-muted'"
              class="size-4"
              aria-hidden="true"
            />
          </span>
        </div>
      </section>
    </form>
  </ToolWorkbench>
</template>

<style scoped>
.guess-feedback {
  animation: guess-pop 220ms ease-out;
}

@keyframes guess-pop {
  from {
    opacity: 0.4;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .guess-feedback {
    animation: none;
  }
}
</style>
