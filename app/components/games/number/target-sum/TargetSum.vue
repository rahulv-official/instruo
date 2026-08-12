<script setup lang="ts">
const numbers = ref<number[]>([]);
const target = ref(0);
const selected = ref<number[]>([]);
const finished = ref(false);
const won = ref(false);
const statusText = computed(() =>
  finished.value
    ? won.value
      ? "Target matched."
      : `Try again. Target was ${target.value}.`
    : `Select two numbers that add to ${target.value}.`,
);
function reset() {
  const a = 2 + Math.floor(Math.random() * 9);
  const b = 2 + Math.floor(Math.random() * 9);
  numbers.value = [a, b, 1 + Math.floor(Math.random() * 9), 1 + Math.floor(Math.random() * 9)].sort(
    () => Math.random() - 0.5,
  );
  target.value = a + b;
  selected.value = [];
  finished.value = false;
  won.value = false;
}
function choose(index: number) {
  if (finished.value) return;
  selected.value = selected.value.includes(index)
    ? selected.value.filter((item) => item !== index)
    : selected.value.length < 2
      ? [...selected.value, index]
      : [index];
  if (selected.value.length === 2) {
    won.value =
      numbers.value[selected.value[0]!]! + numbers.value[selected.value[1]!]! === target.value;
    finished.value = true;
  }
}
onMounted(reset);
</script>

<template>
  <ToolWorkbench description="Choose exactly two tiles whose values add up to the target.">
    <div class="mx-auto grid max-w-md gap-6 text-center">
      <p
        class="text-toned"
        :class="finished ? (won ? 'text-success' : 'text-error') : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <strong class="text-primary font-mono text-5xl">{{ target }}</strong>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="(number, index) in numbers"
          :key="`${number}-${index}`"
          type="button"
          class="target-tile focus-visible:ring-primary border-default/70 bg-muted/20 text-highlighted grid aspect-square place-items-center border text-3xl font-semibold transition-transform focus-visible:ring-2 focus-visible:outline-none active:scale-95"
          :class="selected.includes(index) ? 'border-primary bg-primary/15' : ''"
          :disabled="finished"
          :aria-pressed="selected.includes(index)"
          @click="choose(index)"
        >
          {{ number }}
        </button>
      </div>
      <UButton
        label="New target"
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        class="mx-auto"
        @click="reset"
      />
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.target-tile {
  animation: tile-in 260ms ease-out both;
}
@keyframes tile-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .target-tile {
    animation: none;
  }
}
</style>
