<script setup lang="ts">
const elapsed = ref(0);
const running = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
let startedAt = 0;
const display = computed(() => {
  const total = Math.floor(elapsed.value / 1000);
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  const hundredths = Math.floor((elapsed.value % 1000) / 10)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}.${hundredths}`;
});
function start() {
  if (running.value) return;
  running.value = true;
  startedAt = Date.now() - elapsed.value;
  timer = setInterval(() => {
    elapsed.value = Date.now() - startedAt;
  }, 30);
}
function pause() {
  running.value = false;
  if (timer) clearInterval(timer);
  timer = undefined;
}
function reset() {
  pause();
  elapsed.value = 0;
}
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <ToolWorkbench description="A precise, private stopwatch for quick timing tasks.">
    <div class="grid max-w-xl justify-items-center gap-6">
      <output
        class="text-highlighted font-mono text-6xl tracking-tight tabular-nums"
        aria-live="polite"
        >{{ display }}</output
      >
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          v-if="!running"
          label="Start"
          icon="i-tabler-player-play"
          @click="start"
        />
        <UButton
          v-else
          label="Pause"
          icon="i-tabler-player-pause"
          @click="pause"
        />
        <UButton
          color="neutral"
          variant="ghost"
          label="Reset"
          icon="i-tabler-rotate"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
