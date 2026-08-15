<script setup lang="ts">
const target = ref(randomTarget());
const guess = ref<number | undefined>();
const attempts = ref(0);
const finished = ref(false);
const won = ref(false);
const feedback = ref("Pick a number from 1 to 100.");

function randomTarget() {
  return 1 + Math.floor(Math.random() * 100);
}
const statusText = computed(() =>
  finished.value
    ? won.value
      ? `Correct. It was ${target.value}.`
      : `Out of tries. It was ${target.value}.`
    : feedback.value,
);

function submit() {
  if (finished.value || guess.value === undefined || guess.value < 1 || guess.value > 100) return;
  attempts.value += 1;
  if (guess.value === target.value) {
    won.value = true;
    finished.value = true;
    return;
  }
  if (attempts.value >= 7) {
    finished.value = true;
    return;
  }
  feedback.value = guess.value < target.value ? "Higher." : "Lower.";
}

function reset() {
  target.value = randomTarget();
  guess.value = undefined;
  attempts.value = 0;
  finished.value = false;
  won.value = false;
  feedback.value = "Pick a number from 1 to 100.";
}
</script>

<template>
  <ToolWorkbench description="Find the hidden number in seven guesses. Hints say higher or lower.">
    <form
      class="mx-auto grid max-w-md gap-6"
      @submit.prevent="submit"
    >
      <p
        class="guess-feedback text-center text-lg font-medium"
        :class="finished ? (won ? 'text-success' : 'text-error') : 'text-toned'"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <UFormField
        label="Your guess"
        description="Whole number between 1 and 100."
      >
        <UInput
          v-model.number="guess"
          type="number"
          min="1"
          max="100"
          size="xl"
          class="w-full"
          :disabled="finished"
          placeholder="42"
        />
      </UFormField>
      <div class="flex items-center justify-between gap-4">
        <span class="text-muted font-mono text-sm">{{ attempts }}/7 guesses</span>
        <div class="flex gap-2">
          <UButton
            type="submit"
            label="Guess"
            size="lg"
            :disabled="finished || guess === undefined"
          /><UButton
            label="New number"
            color="neutral"
            variant="outline"
            icon="i-tabler-refresh"
            @click="reset"
          />
        </div>
      </div>
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
