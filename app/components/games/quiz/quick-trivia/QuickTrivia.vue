<script setup lang="ts">
interface Question {
  answer: number;
  options: string[];
  prompt: string;
  topic: string;
}

const questions: Question[] = [
  {
    answer: 2,
    options: ["Venus", "Jupiter", "Mars", "Mercury"],
    prompt: "Which planet is known as the Red Planet?",
    topic: "Science",
  },
  {
    answer: 1,
    options: ["Atlantic", "Pacific", "Indian", "Arctic"],
    prompt: "Which is the largest ocean on Earth?",
    topic: "Geography",
  },
  {
    answer: 0,
    options: ["Jane Austen", "Virginia Woolf", "George Eliot", "Mary Shelley"],
    prompt: "Who wrote Pride and Prejudice?",
    topic: "Books",
  },
  {
    answer: 3,
    options: ["Silver", "Argon", "Aluminium", "Gold"],
    prompt: "Which element uses the symbol Au?",
    topic: "Science",
  },
  {
    answer: 2,
    options: ["Six", "Seven", "Eight", "Nine"],
    prompt: "How many sides does an octagon have?",
    topic: "Math",
  },
];

const questionIndex = ref(0);
const selectedAnswer = ref<number | null>(null);
const score = ref(0);

const currentQuestion = computed(() => questions[questionIndex.value]!);
const isAnswered = computed(() => selectedAnswer.value !== null);
const isCorrect = computed(() => selectedAnswer.value === currentQuestion.value.answer);
const isComplete = computed(() => questionIndex.value === questions.length - 1 && isAnswered.value);
const status = computed(() => {
  if (isComplete.value)
    return score.value >= 4
      ? `Round complete: ${score.value}/${questions.length}.`
      : `Round complete: ${score.value}/${questions.length}. Try another.`;
  if (!isAnswered.value) return "Choose one answer.";
  return isCorrect.value
    ? "Correct."
    : `Not quite. ${currentQuestion.value.options[currentQuestion.value.answer]} is right.`;
});

function selectAnswer(index: number) {
  if (isAnswered.value) return;
  selectedAnswer.value = index;
  if (index === currentQuestion.value.answer) score.value += 1;
}

function nextQuestion() {
  if (isComplete.value) {
    questionIndex.value = 0;
    selectedAnswer.value = null;
    score.value = 0;
    return;
  }
  questionIndex.value += 1;
  selectedAnswer.value = null;
}

function optionClass(index: number) {
  if (!isAnswered.value)
    return "border-default/70 bg-default text-highlighted hover:bg-elevated/60";
  if (index === currentQuestion.value.answer) return "border-success bg-success/15 text-success";
  if (index === selectedAnswer.value) return "border-error bg-error/15 text-error";
  return "border-default/50 bg-default text-muted";
}

if (import.meta.dev && questions.some((question) => !question.options[question.answer])) {
  throw new Error("Quick Trivia question check failed");
}
</script>

<template>
  <ToolWorkbench
    description="Five clear questions across science, geography, books, and math. No timer, no account."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="
            isComplete && score < 4
              ? 'text-error'
              : isComplete || (isAnswered && isCorrect)
                ? 'text-success'
                : isAnswered
                  ? 'text-error'
                  : 'text-toned'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="(isComplete && score < 4) || (isAnswered && !isCorrect)"
            name="i-lucide-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="isComplete || (isAnswered && isCorrect)"
            name="i-lucide-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm tabular-nums"
          >{{ questionIndex + 1 }}/{{ questions.length }} · {{ score }} points</span
        >
      </div>

      <div
        class="border-default/70 bg-muted/20 grid min-h-44 content-center gap-4 border p-6 sm:min-h-52 sm:p-8"
      >
        <span class="text-muted text-xs font-semibold tracking-[0.14em] uppercase">{{
          currentQuestion.topic
        }}</span>
        <h2 class="text-highlighted text-2xl leading-tight font-semibold text-balance sm:text-3xl">
          {{ currentQuestion.prompt }}
        </h2>
      </div>

      <div class="grid gap-2 sm:grid-cols-2 sm:gap-3">
        <button
          v-for="(option, index) in currentQuestion.options"
          :key="option"
          type="button"
          class="focus-visible:ring-primary min-h-14 border px-4 text-left text-sm font-medium transition-[background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.99] disabled:cursor-default"
          :class="optionClass(index)"
          :disabled="isAnswered"
          @click="selectAnswer(index)"
        >
          <span class="text-muted mr-3 font-mono">{{ String.fromCharCode(65 + index) }}</span
          >{{ option }}
        </button>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">Answers appear after each choice.</p>
        <UButton
          :label="isComplete ? 'Play again' : 'Next question'"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
          :disabled="!isAnswered"
          @click="nextQuestion"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
