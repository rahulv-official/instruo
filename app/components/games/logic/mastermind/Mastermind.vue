<script setup lang="ts">
const code = ref(makeCode());
const guess = ref("");
const attempts = ref<{ value: string; exact: number; close: number }[]>([]);
const done = computed(
  () => attempts.value.some((attempt) => attempt.exact === 4) || attempts.value.length >= 8,
);
const won = computed(() => attempts.value.some((attempt) => attempt.exact === 4));
const statusText = computed(() =>
  won.value
    ? "Code cracked."
    : done.value
      ? `Code was ${code.value}.`
      : "Find four digits from 1 to 6.",
);

function makeCode() {
  return Array.from({ length: 4 }, () => String(1 + Math.floor(Math.random() * 6))).join("");
}
function score(value: string) {
  const exact = [...value].filter((digit, index) => digit === code.value[index]).length;
  const counts = new Map<string, number>();
  for (const digit of code.value) counts.set(digit, (counts.get(digit) ?? 0) + 1);
  let shared = 0;
  for (const digit of value) {
    const count = counts.get(digit) ?? 0;
    if (count > 0) {
      shared += 1;
      counts.set(digit, count - 1);
    }
  }
  return { exact, close: shared - exact };
}
function submit() {
  const value = guess.value.replace(/[^1-6]/g, "").slice(0, 4);
  if (done.value || value.length !== 4) return;
  attempts.value = [...attempts.value, { value, ...score(value) }];
  guess.value = "";
}
function reset() {
  code.value = makeCode();
  guess.value = "";
  attempts.value = [];
}
</script>

<template>
  <ToolWorkbench
    description="Crack the hidden four-digit code. Exact matches share a place; close matches share a digit."
  >
    <div class="mx-auto grid max-w-lg gap-6">
      <p
        class="text-toned text-center"
        :class="won ? 'text-success' : done ? 'text-error' : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <form
        class="flex gap-3"
        @submit.prevent="submit"
      >
        <UInput
          v-model="guess"
          inputmode="numeric"
          maxlength="4"
          size="xl"
          class="w-full font-mono tracking-[.35em]"
          placeholder="1234"
          :disabled="done"
        /><UButton
          type="submit"
          label="Check"
          size="xl"
          :disabled="done || guess.replace(/[^1-6]/g, '').length !== 4"
        />
      </form>
      <ol class="border-default/70 border-t">
        <li
          v-for="attempt in attempts"
          :key="`${attempt.value}-${attempts.indexOf(attempt)}`"
          class="mastermind-row border-default/70 flex items-center justify-between border-b py-3 font-mono"
        >
          <span>{{ attempt.value }}</span
          ><span class="text-muted text-sm"
            >{{ attempt.exact }} exact · {{ attempt.close }} close</span
          >
        </li>
      </ol>
      <div class="flex items-center justify-between">
        <span class="text-muted font-mono text-xs">{{ attempts.length }}/8 attempts</span
        ><UButton
          label="New code"
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
.mastermind-row {
  animation: mastermind-in 220ms ease-out;
}
@keyframes mastermind-in {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mastermind-row {
    animation: none;
  }
}
</style>
