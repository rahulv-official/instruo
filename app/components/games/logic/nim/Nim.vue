<script setup lang="ts">
const piles = shallowRef([3, 4, 5]);
const player = ref<1 | 2>(1);
const finished = computed(() => piles.value.every((pile) => pile === 0));
const winner = computed(() => (finished.value ? (player.value === 1 ? 2 : 1) : null));
const statusText = computed(() =>
  finished.value
    ? `Player ${winner.value} wins.`
    : `Player ${player.value}: take stones from one pile.`,
);

function take(pileIndex: number, amount: number) {
  if (finished.value || amount < 1 || amount > piles.value[pileIndex]!) return;
  const next = [...piles.value];
  next[pileIndex] = next[pileIndex]! - amount;
  piles.value = next;
  player.value = player.value === 1 ? 2 : 1;
}
function reset() {
  piles.value = [3, 4, 5];
  player.value = 1;
}
</script>

<template>
  <ToolWorkbench
    description="Two players take one or more stones from a single pile. Take the last stone to win."
  >
    <div class="mx-auto grid max-w-xl gap-6">
      <p
        class="text-toned text-center"
        :class="finished ? 'text-success font-semibold' : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <div class="grid gap-4 sm:grid-cols-3">
        <div
          v-for="(pile, pileIndex) in piles"
          :key="pileIndex"
          class="border-default/70 grid gap-4 border p-4 text-center"
        >
          <span class="text-muted font-mono text-xs uppercase">Pile {{ pileIndex + 1 }}</span>
          <div class="nim-stones flex min-h-20 flex-wrap content-center justify-center gap-2">
            <span
              v-for="stone in pile"
              :key="stone"
              class="bg-primary size-5 rounded-full transition-transform"
              aria-hidden="true"
            />
          </div>
          <div class="flex flex-wrap justify-center gap-1">
            <UButton
              v-for="amount in Math.min(pile, 3)"
              :key="amount"
              :label="`Take ${amount}`"
              size="xs"
              color="neutral"
              variant="outline"
              :disabled="finished"
              @click="take(pileIndex, amount)"
            />
          </div>
        </div>
      </div>
      <UButton
        label="New match"
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
.nim-stones span {
  animation: stone-in 260ms ease-out;
}
@keyframes stone-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .nim-stones span {
    animation: none;
  }
}
</style>
