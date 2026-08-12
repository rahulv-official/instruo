<script setup lang="ts">
const words = [
  "BROWSER",
  "GARDEN",
  "JOURNEY",
  "KITCHEN",
  "LANTERN",
  "MOUNTAIN",
  "ORANGE",
  "PUZZLE",
  "ROCKET",
  "SUNSHINE",
  "TUNNEL",
  "WINDOW",
];
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const maxMistakes = 6;

const answer = ref(words[0]!);
const guessedLetters = shallowRef<string[]>([]);

const guessedSet = computed(() => new Set(guessedLetters.value));
const wrongLetters = computed(() =>
  guessedLetters.value.filter((letter) => !answer.value.includes(letter)),
);
const uniqueLetters = computed(() => [...new Set(answer.value)]);
const isWon = computed(() => uniqueLetters.value.every((letter) => guessedSet.value.has(letter)));
const isLost = computed(() => wrongLetters.value.length >= maxMistakes);
const gameOver = computed(() => isWon.value || isLost.value);
const status = computed(() => {
  if (isWon.value) return `Solved with ${maxMistakes - wrongLetters.value.length} mistakes left.`;
  if (isLost.value) return `Out of guesses. The word was ${answer.value}.`;
  return `Choose a letter. ${maxMistakes - wrongLetters.value.length} mistakes left.`;
});

function guess(letter: string) {
  if (gameOver.value || guessedSet.value.has(letter)) return;
  guessedLetters.value = [...guessedLetters.value, letter];
}

function reset() {
  answer.value = words[Math.floor(Math.random() * words.length)]!;
  guessedLetters.value = [];
}

function keyClass(letter: string) {
  if (!guessedSet.value.has(letter))
    return "border-default/70 bg-default text-highlighted hover:bg-elevated/60";
  return answer.value.includes(letter)
    ? "border-success bg-success/15 text-success"
    : "border-error bg-error/15 text-error";
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.matches("input, textarea, [contenteditable='true']")) return;
  if (/^[a-z]$/i.test(event.key)) guess(event.key.toUpperCase());
}

if (import.meta.dev && words.some((word) => !/^[A-Z]+$/.test(word))) {
  throw new Error("Hangman word check failed");
}

useEventListener("keydown", handleKeydown);
onMounted(reset);
</script>

<template>
  <ToolWorkbench
    description="Reveal a hidden word before six incorrect letters complete the drawing."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="isLost ? 'text-error' : isWon ? 'text-success' : 'text-toned'"
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="isLost"
            name="i-lucide-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="isWon"
            name="i-lucide-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm"
          >{{ wrongLetters.length }}/{{ maxMistakes }}</span
        >
      </div>

      <div class="grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
        <div
          class="border-default/70 bg-muted/20 flex aspect-square items-center justify-center border"
        >
          <svg
            viewBox="0 0 160 180"
            class="text-muted h-full w-full p-5"
            fill="none"
            stroke="currentColor"
            stroke-linecap="square"
            stroke-width="8"
            aria-label="Hangman drawing"
            role="img"
          >
            <path d="M24 164h112M48 164V20h70M118 20v26" />
            <circle
              v-if="wrongLetters.length >= 1"
              cx="118"
              cy="62"
              r="16"
              class="text-error"
            />
            <path
              v-if="wrongLetters.length >= 2"
              d="M118 78v42"
              class="text-error"
            />
            <path
              v-if="wrongLetters.length >= 3"
              d="m118 90-24 20"
              class="text-error"
            />
            <path
              v-if="wrongLetters.length >= 4"
              d="m118 90 24 20"
              class="text-error"
            />
            <path
              v-if="wrongLetters.length >= 5"
              d="m118 120-20 28"
              class="text-error"
            />
            <path
              v-if="wrongLetters.length >= 6"
              d="m118 120 20 28"
              class="text-error"
            />
          </svg>
        </div>

        <div class="grid gap-6">
          <div
            class="flex flex-wrap justify-center gap-2 sm:justify-start"
            aria-label="Hidden word"
          >
            <span
              v-for="(letter, index) in answer"
              :key="`${letter}-${index}`"
              class="border-default/70 bg-muted/20 flex size-11 items-center justify-center border-b-2 font-mono text-xl font-semibold sm:size-12"
              :class="guessedSet.has(letter) || isLost ? 'text-highlighted' : 'text-transparent'"
            >
              {{ guessedSet.has(letter) || isLost ? letter : "_" }}
            </span>
          </div>

          <p class="text-muted text-sm leading-6">
            <strong class="text-highlighted">Misses:</strong>
            {{ wrongLetters.length ? wrongLetters.join(", ") : "None" }}
          </p>
        </div>
      </div>

      <div class="grid gap-2">
        <div
          v-for="row in keyboardRows"
          :key="row"
          class="flex justify-center gap-1.5"
        >
          <button
            v-for="letter in row"
            :key="letter"
            type="button"
            class="focus-visible:ring-primary min-h-11 min-w-0 flex-1 border px-1 font-mono text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:max-w-11"
            :class="keyClass(letter)"
            :disabled="gameOver || guessedSet.has(letter)"
            :aria-label="`Guess ${letter}`"
            @click="guess(letter)"
          >
            {{ letter }}
          </button>
        </div>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">Use keyboard or select letters on screen.</p>
        <UButton
          label="New word"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
