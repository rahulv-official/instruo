<script setup lang="ts">
import wordleAnswers from "#wordle-answers";
import wordleGuesses from "#wordle-guesses";

type TileState = "absent" | "active" | "correct" | "empty" | "filled" | "present";

const answers = (wordleAnswers as string[])
  .filter((word) => word.length === 5)
  .map((word) => word.toUpperCase());
const validWords = new Set(
  [...(wordleAnswers as string[]), ...(wordleGuesses as string[])]
    .filter((word) => word.length === 5)
    .map((word) => word.toUpperCase()),
);
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const maxGuesses = 6;
const wordLength = 5;

const dailyIndex = Math.floor(Date.now() / 86_400_000) % answers.length;
const practiceOffset = ref(0);
const guesses = ref<string[]>([]);
const currentGuess = ref("");
const notice = ref({ text: "Enter a five-letter word.", error: false });

const target = computed(() => answers[(dailyIndex + practiceOffset.value) % answers.length]!);
const status = computed<"playing" | "won" | "lost">(() => {
  if (guesses.value.includes(target.value)) return "won";
  if (guesses.value.length >= maxGuesses) return "lost";
  return "playing";
});

const message = computed(() => {
  if (status.value === "won") return `Solved in ${guesses.value.length} of ${maxGuesses} guesses.`;
  if (status.value === "lost") return `The word was ${target.value}.`;
  return notice.value.text;
});

const evaluations = computed(() => guesses.value.map(evaluateGuess));
const keyStates = computed(() => {
  const ranking: Record<TileState, number> = {
    active: 0,
    empty: 0,
    filled: 1,
    absent: 2,
    present: 3,
    correct: 4,
  };
  const states = new Map<string, TileState>();

  guesses.value.forEach((guess, row) => {
    Array.from(guess).forEach((letter, column) => {
      const nextState = evaluations.value[row]![column]!;
      const currentState = states.get(letter) ?? "empty";
      if (ranking[nextState] > ranking[currentState]) states.set(letter, nextState);
    });
  });

  return states;
});

function evaluateGuess(guess: string): TileState[] {
  const remaining = Array.from(target.value);
  const states = Array.from<TileState>({ length: wordLength }).fill("absent");

  Array.from(guess).forEach((letter, index) => {
    if (letter === remaining[index]) {
      states[index] = "correct";
      remaining[index] = "";
    }
  });

  Array.from(guess).forEach((letter, index) => {
    if (states[index] === "correct") return;
    const match = remaining.indexOf(letter);
    if (match >= 0) {
      states[index] = "present";
      remaining[match] = "";
    }
  });

  return states;
}

function tileLetter(row: number, column: number) {
  if (row < guesses.value.length) return guesses.value[row]?.[column] ?? "";
  if (row === guesses.value.length) return currentGuess.value[column] ?? "";
  return "";
}

function tileState(row: number, column: number): TileState {
  if (row < evaluations.value.length) return evaluations.value[row]?.[column] ?? "absent";
  if (
    status.value === "playing" &&
    row === guesses.value.length &&
    column === currentGuess.value.length
  ) {
    return "active";
  }
  return tileLetter(row, column) ? "filled" : "empty";
}

function stateClasses(state: TileState) {
  return {
    absent: "border-accented bg-accented text-muted",
    active: "border-primary bg-primary/10 text-highlighted ring-4 ring-primary/15",
    correct: "border-success bg-success/20 text-highlighted",
    empty: "border-default bg-default text-highlighted",
    filled: "border-accented bg-elevated/50 text-highlighted",
    present: "border-warning bg-warning/25 text-highlighted",
  }[state];
}

function resetNotice() {
  notice.value = { text: "Enter a five-letter word.", error: false };
}

function pressKey(key: string) {
  if (status.value !== "playing") return;

  if (key === "ENTER") {
    if (currentGuess.value.length !== wordLength) {
      notice.value = {
        text: `${wordLength - currentGuess.value.length} letters remaining.`,
        error: true,
      };
      return;
    }
    if (!validWords.has(currentGuess.value)) {
      notice.value = { text: "Not in the dictionary. Try another word.", error: true };
      return;
    }

    guesses.value = [...guesses.value, currentGuess.value];
    currentGuess.value = "";
    notice.value = { text: "Keep going.", error: false };
    return;
  }

  if (key === "BACKSPACE") {
    currentGuess.value = currentGuess.value.slice(0, -1);
    if (notice.value.error) resetNotice();
    return;
  }

  if (/^[A-Z]$/.test(key) && currentGuess.value.length < wordLength) {
    currentGuess.value += key;
    if (notice.value.error) resetNotice();
  }
}

function handleKeydown(event: KeyboardEvent) {
  const element = event.target as HTMLElement | null;
  if (element?.matches("input, textarea, [contenteditable='true']")) return;

  if (event.key === "Enter") pressKey("ENTER");
  else if (event.key === "Backspace" || event.key === "Delete") pressKey("BACKSPACE");
  else if (/^[a-z]$/i.test(event.key)) pressKey(event.key.toUpperCase());
}

function newWord() {
  practiceOffset.value = (practiceOffset.value + 1) % answers.length;
  guesses.value = [];
  currentGuess.value = "";
  resetNotice();
}

useEventListener("keydown", handleKeydown);
</script>

<template>
  <ToolWorkbench
    description="Guess the five-letter word in six tries. Use your keyboard or the keys below."
  >
    <div class="mx-auto max-w-2xl">
      <div class="flex flex-col items-center gap-7">
        <p
          class="min-h-6 w-full text-center text-sm"
          :class="notice.error && status === 'playing' ? 'text-error' : 'text-toned'"
          role="status"
          aria-live="polite"
        >
          {{ message }}
        </p>

        <div
          class="grid gap-2"
          aria-label="Word grid"
        >
          <div
            v-for="row in maxGuesses"
            :key="row"
            class="grid grid-cols-5 gap-2"
            :aria-current="row - 1 === guesses.length && status === 'playing' ? 'step' : undefined"
          >
            <div
              v-for="column in wordLength"
              :key="column"
              class="flex size-12 items-center justify-center border-2 font-mono text-xl font-semibold transition-colors sm:size-14 sm:text-2xl"
              :class="stateClasses(tileState(row - 1, column - 1))"
            >
              {{ tileLetter(row - 1, column - 1) }}
            </div>
          </div>
        </div>

        <div class="grid w-full gap-2">
          <div
            v-for="(row, rowIndex) in keyboardRows"
            :key="row"
            class="flex w-full justify-center gap-1 sm:gap-1.5"
          >
            <button
              v-if="rowIndex === 2"
              type="button"
              class="focus-visible:ring-primary border-default/70 hover:bg-elevated/60 min-h-11 shrink-0 border px-1.5 font-mono text-[0.625rem] font-semibold focus-visible:ring-2 focus-visible:outline-none sm:px-3 sm:text-xs"
              @click="pressKey('ENTER')"
            >
              ENTER
            </button>
            <button
              v-for="letter in row"
              :key="letter"
              type="button"
              class="focus-visible:ring-primary border-default/70 hover:bg-elevated/60 min-h-11 min-w-0 flex-1 border px-0.5 font-mono text-[0.65rem] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:min-w-10 sm:px-1 sm:text-sm"
              :class="stateClasses(keyStates.get(letter) ?? 'empty')"
              :aria-label="`Letter ${letter}`"
              @click="pressKey(letter)"
            >
              {{ letter }}
            </button>
            <button
              v-if="rowIndex === 2"
              type="button"
              class="focus-visible:ring-primary border-default/70 hover:bg-elevated/60 min-h-11 shrink-0 border px-1.5 font-mono text-[0.625rem] font-semibold focus-visible:ring-2 focus-visible:outline-none sm:px-3 sm:text-xs"
              aria-label="Delete letter"
              @click="pressKey('BACKSPACE')"
            >
              DELETE
            </button>
          </div>
        </div>
      </div>

      <div class="border-default/70 mt-7 border-t pt-5">
        <div
          class="grid gap-3 sm:grid-cols-3"
          aria-label="Color guide"
        >
          <div class="flex items-center gap-3 text-sm">
            <span
              class="border-success bg-success/20 flex size-9 shrink-0 items-center justify-center border-2 font-mono font-semibold"
            >
              A
            </span>
            <span class="text-muted">
              <strong class="text-highlighted block">Green</strong>
              correct spot
            </span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span
              class="border-warning bg-warning/25 flex size-9 shrink-0 items-center justify-center border-2 font-mono font-semibold"
            >
              R
            </span>
            <span class="text-muted">
              <strong class="text-highlighted block">Yellow</strong>
              wrong spot
            </span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span
              class="border-accented bg-accented text-muted flex size-9 shrink-0 items-center justify-center border-2 font-mono font-semibold"
            >
              E
            </span>
            <span class="text-muted">
              <strong class="text-highlighted block">Gray</strong>
              not in word
            </span>
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <UButton
            label="New word"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            @click="newWord"
          />
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
