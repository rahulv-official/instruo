<script setup lang="ts">
const questions = [
  { country: "Japan", answer: "Tokyo", options: ["Tokyo", "Kyoto", "Osaka", "Sapporo"] },
  {
    country: "Brazil",
    answer: "Brasília",
    options: ["Rio de Janeiro", "Brasília", "Salvador", "São Paulo"],
  },
  { country: "Canada", answer: "Ottawa", options: ["Toronto", "Vancouver", "Ottawa", "Montreal"] },
  { country: "Kenya", answer: "Nairobi", options: ["Mombasa", "Nairobi", "Kisumu", "Eldoret"] },
];
const index = ref(0);
const score = ref(0);
const selected = ref("");
const finished = computed(() => index.value >= questions.length);
const question = computed(() => questions[index.value]);
const statusText = computed(() =>
  finished.value
    ? `Quiz complete. ${score.value}/${questions.length} correct.`
    : `What is capital of ${question.value?.country}?`,
);
function answer(value: string) {
  if (selected.value || finished.value) return;
  selected.value = value;
  if (value === question.value?.answer) score.value += 1;
  setTimeout(() => {
    selected.value = "";
    index.value += 1;
  }, 650);
}
function reset() {
  index.value = 0;
  score.value = 0;
  selected.value = "";
}
</script>

<template>
  <ToolWorkbench description="Answer four capital-city questions. Pick one option per round.">
    <div class="mx-auto grid max-w-xl gap-6 text-center">
      <p
        class="text-toned"
        :class="finished ? 'text-success' : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <template v-if="!finished && question">
        <div class="capital-question border-default/70 bg-muted/20 border p-8">
          <span class="text-muted text-xs uppercase">Country</span>
          <h2 class="text-highlighted mt-2 text-3xl font-semibold">{{ question.country }}</h2>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <UButton
            v-for="option in question.options"
            :key="option"
            :label="option"
            color="neutral"
            variant="outline"
            size="lg"
            :class="
              selected === option
                ? option === question.answer
                  ? 'border-success text-success'
                  : 'border-error text-error'
                : ''
            "
            :disabled="!!selected"
            @click="answer(option)"
          />
        </div>
      </template>
      <UButton
        v-else
        label="Play again"
        icon="i-lucide-refresh-cw"
        class="mx-auto"
        @click="reset"
      />
      <span class="text-muted font-mono text-xs">{{ Math.min(index + 1, questions.length) }}/{{ questions.length }}</span>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.capital-question {
  animation: question-in 260ms ease-out;
}
@keyframes question-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .capital-question {
    animation: none;
  }
}
</style>
