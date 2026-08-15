<script setup lang="ts">
const words = [
  "BROWSER",
  "COMPASS",
  "JOURNEY",
  "LANTERN",
  "MOUNTAIN",
  "ORANGE",
  "PUZZLE",
  "ROCKET",
  "SUNSHINE",
  "WINDOW",
];
const maxAttempts = 4;

const answer = ref(words[0]!);
const scrambled = ref(scramble(answer.value));
const guess = ref("");
const attempts = ref(0);
const solved = ref(false);
const feedbackKey = ref(0);
const feedback = ref<"" | "wrong">("");

const isSolved = computed(() => solved.value);
const isLost = computed(() => attempts.value >= maxAttempts && !solved.value);
const gameOver = computed(() => isSolved.value || isLost.value);
const statusText = computed(() => {
  if (isSolved.value)
    return `Solved in ${attempts.value} ${attempts.value === 1 ? "try" : "tries"}.`;
  if (isLost.value) return `Out of tries. The word was ${answer.value}.`;
  return `${maxAttempts - attempts.value} tries left.`;
});

function scramble(word: string): string {
  const letters = [...word];
  for (let index = letters.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [letters[index], letters[swapIndex]] = [letters[swapIndex]!, letters[index]!];
  }
  const result = letters.join("");
  return result === word ? scramble(word) : result;
}

function submit() {
  if (gameOver.value || !guess.value.trim()) return;
  const isCorrect = guess.value.trim().toUpperCase() === answer.value;
  attempts.value += 1;
  solved.value = isCorrect;
  feedback.value = isCorrect ? "" : "wrong";
  feedbackKey.value += 1;
}

function reset() {
  const nextWords = words.filter((word) => word !== answer.value);
  answer.value = nextWords[Math.floor(Math.random() * nextWords.length)] ?? words[0]!;
  scrambled.value = scramble(answer.value);
  guess.value = "";
  attempts.value = 0;
  solved.value = false;
  feedback.value = "";
  feedbackKey.value += 1;
}
</script>

<template>
  <ToolWorkbench description="Unscramble the letters and find the hidden word in four tries.">
    <form
      class="mx-auto grid max-w-xl gap-6"
      @submit.prevent="submit"
    >
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="text-toned flex items-center gap-2 text-sm leading-6"
          :class="isLost ? 'text-error' : isSolved ? 'text-success' : ''"
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="isLost"
            name="i-tabler-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="isSolved"
            name="i-tabler-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ statusText }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm tabular-nums">
          {{ attempts }}/{{ maxAttempts }}
        </span>
      </div>

      <div
        class="border-default/70 bg-muted/20 grid min-h-44 place-items-center gap-3 border p-6 text-center sm:min-h-52 sm:p-8"
      >
        <span class="text-muted text-xs font-semibold tracking-[0.14em] uppercase">
          Scrambled word
        </span>
        <strong class="text-highlighted font-mono text-[clamp(2rem,8vw,3.5rem)] tracking-[0.18em]">
          {{ scrambled }}
        </strong>
      </div>

      <UFormField
        label="Your answer"
        description="Use letters only. Guessing ignores letter case."
      >
        <div class="flex flex-col gap-3 sm:flex-row">
          <UInput
            v-model="guess"
            class="w-full"
            size="xl"
            placeholder="Type the word"
            autocomplete="off"
            :disabled="gameOver"
          />
          <UButton
            type="submit"
            label="Check answer"
            size="xl"
            :disabled="gameOver || !guess.trim()"
          />
        </div>
      </UFormField>

      <Transition
        name="scramble-feedback"
        mode="out-in"
      >
        <p
          v-if="feedback === 'wrong' && !isSolved && !isLost"
          :key="feedbackKey"
          class="text-error text-sm"
        >
          Not this time. Try another arrangement.
        </p>
        <p
          v-else-if="isSolved"
          key="solved"
          class="text-success text-sm"
        >
          Correct. Nice solve.
        </p>
        <p
          v-else-if="isLost"
          key="lost"
          class="text-error text-sm"
        >
          The answer was {{ answer }}.
        </p>
        <span
          v-else
          key="empty"
          class="h-5"
          aria-hidden="true"
        />
      </Transition>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">
          Every round is generated locally from a short word list.
        </p>
        <UButton
          label="New word"
          color="neutral"
          variant="outline"
          icon="i-tabler-refresh"
          @click="reset"
        />
      </div>
    </form>
  </ToolWorkbench>
</template>

<style scoped>
.scramble-feedback-enter-active,
.scramble-feedback-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.scramble-feedback-enter-from,
.scramble-feedback-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .scramble-feedback-enter-active,
  .scramble-feedback-leave-active {
    transition: none;
  }
}
</style>
