<script setup lang="ts">
const current = ref(randomNumber());
const next = ref(randomNumber());
const score = ref(0);
const finished = ref(false);
const won = ref(false);
const statusText = computed(() =>
  finished.value
    ? won.value
      ? `Correct. Score ${score.value}.`
      : `Round over at ${score.value}.`
    : `Will next number be higher or lower than ${current.value}?`,
);
function randomNumber() {
  return 1 + Math.floor(Math.random() * 100);
}
function choose(direction: "higher" | "lower") {
  if (finished.value) return;
  const value = next.value;
  const correct = direction === "higher" ? value > current.value : value < current.value;
  if (!correct || value === current.value) {
    finished.value = true;
    won.value = false;
    return;
  }
  score.value += 1;
  current.value = value;
  next.value = randomNumber();
  won.value = true;
}
function reset() {
  current.value = randomNumber();
  next.value = randomNumber();
  score.value = 0;
  finished.value = false;
  won.value = false;
}
</script>

<template>
  <ToolWorkbench
    description="Predict whether the next number is higher or lower. Equal numbers end the round."
  >
    <div class="mx-auto grid max-w-md gap-6 text-center">
      <p
        class="text-toned"
        :class="finished ? 'text-error' : won ? 'text-success' : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <div class="higher-lower-card border-default/70 bg-muted/20 grid gap-2 border p-10">
        <span class="text-muted text-xs uppercase">Current number</span><strong class="text-highlighted font-mono text-6xl">{{ current }}</strong>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <UButton
          label="Higher"
          icon="i-lucide-arrow-up"
          size="xl"
          :disabled="finished"
          @click="choose('higher')"
        /><UButton
          label="Lower"
          icon="i-lucide-arrow-down"
          size="xl"
          :disabled="finished"
          @click="choose('lower')"
        />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-muted font-mono text-sm">Score {{ score }}</span><UButton
          label="New round"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
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
