<script setup lang="ts">
const current = ref(randomNumber());
const next = ref(randomNumber());
const score = ref(0);
const finished = ref(false);
const lastResult = ref<"correct" | "wrong" | null>(null);
const lastPrediction = ref<"higher" | "lower" | null>(null);
const comparedFrom = ref<number | null>(null);
const revealedNext = ref<number | null>(null);
const statusText = computed(() =>
  finished.value
    ? `Round over at ${score.value}. The next number was ${revealedNext.value}.`
    : lastResult.value === "correct"
      ? `Correct. ${revealedNext.value} was ${lastPrediction.value}. Keep going.`
      : `Will next number be higher or lower than ${current.value}?`,
);
const outcomeDescription = computed(() => {
  if (!lastResult.value || revealedNext.value === null || comparedFrom.value === null) return "";
  if (lastResult.value === "correct") {
    return `You chose ${lastPrediction.value}. ${revealedNext.value} came after ${comparedFrom.value}.`;
  }
  if (revealedNext.value === comparedFrom.value) {
    return `Both numbers were ${revealedNext.value}. Equal numbers end the round.`;
  }
  const actualDirection = revealedNext.value > comparedFrom.value ? "higher" : "lower";
  return `You chose ${lastPrediction.value}, but ${revealedNext.value} was ${actualDirection}.`;
});
function randomNumber() {
  return 1 + Math.floor(Math.random() * 100);
}
function choose(direction: "higher" | "lower") {
  if (finished.value) return;
  const value = next.value;
  comparedFrom.value = current.value;
  revealedNext.value = value;
  lastPrediction.value = direction;
  const correct = direction === "higher" ? value > current.value : value < current.value;
  if (!correct || value === current.value) {
    finished.value = true;
    lastResult.value = "wrong";
    return;
  }
  score.value += 1;
  current.value = value;
  next.value = randomNumber();
  lastResult.value = "correct";
}
function reset() {
  current.value = randomNumber();
  next.value = randomNumber();
  score.value = 0;
  finished.value = false;
  lastResult.value = null;
  lastPrediction.value = null;
  comparedFrom.value = null;
  revealedNext.value = null;
}
</script>

<template>
  <ToolWorkbench
    description="Predict whether the next number is higher or lower. Equal numbers end the round."
  >
    <div class="mx-auto grid max-w-md gap-6 text-center">
      <p
        class="text-toned"
        :class="finished ? 'text-error' : lastResult === 'correct' ? 'text-success' : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <UAlert
        v-if="lastResult"
        :color="lastResult === 'correct' ? 'success' : 'error'"
        variant="subtle"
        :icon="lastResult === 'correct' ? 'i-tabler-circle-check' : 'i-tabler-circle-x'"
        :title="lastResult === 'correct' ? 'Correct prediction' : 'Prediction missed'"
        :description="outcomeDescription"
      />
      <div
        class="higher-lower-card border-default/70 bg-muted/20 grid gap-2 rounded-lg border p-10"
        :class="
          lastResult === 'correct'
            ? 'ring-success/25 ring-2'
            : lastResult === 'wrong'
              ? 'ring-error/25 ring-2'
              : ''
        "
      >
        <span class="text-muted text-xs uppercase">Current number</span
        ><strong class="text-highlighted font-mono text-6xl">{{ current }}</strong>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <UButton
          label="Higher"
          icon="i-tabler-arrow-up"
          size="xl"
          :disabled="finished"
          @click="choose('higher')"
        /><UButton
          label="Lower"
          icon="i-tabler-arrow-down"
          size="xl"
          :disabled="finished"
          @click="choose('lower')"
        />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-muted font-mono text-sm">Score {{ score }}</span
        ><UButton
          label="New round"
          color="neutral"
          variant="outline"
          icon="i-tabler-refresh"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.higher-lower-card {
  animation: card-lift 260ms ease-out;
}
@keyframes card-lift {
  from {
    opacity: 0.5;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .higher-lower-card {
    animation: none;
  }
}
</style>
