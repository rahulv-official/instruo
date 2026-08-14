<script setup lang="ts">
type Mode = "focus" | "short" | "long";
const mode = ref<Mode>("focus");
const durations: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const secondsLeft = ref(durations.focus);
const running = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
const display = computed(
  () =>
    `${Math.floor(secondsLeft.value / 60)
      .toString()
      .padStart(2, "0")}:${(secondsLeft.value % 60).toString().padStart(2, "0")}`,
);
const progress = computed(
  () => ((durations[mode.value] - secondsLeft.value) / durations[mode.value]) * 100,
);
function setMode(next: Mode) {
  mode.value = next;
  reset();
}
function start() {
  if (running.value) return;
  running.value = true;
  timer = setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value -= 1;
    else pause();
  }, 1000);
}
function pause() {
  running.value = false;
  if (timer) clearInterval(timer);
  timer = undefined;
}
function reset() {
  pause();
  secondsLeft.value = durations[mode.value];
}
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <ToolWorkbench
    description="A focused browser timer for deep work, short breaks, and long breaks."
  >
    <div class="grid max-w-xl justify-items-center gap-6">
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          v-for="item in [
            { label: 'Focus', value: 'focus' },
            { label: 'Short break', value: 'short' },
            { label: 'Long break', value: 'long' },
          ]"
          :key="item.value"
          :label="item.label"
          :color="mode === item.value ? 'primary' : 'neutral'"
          :variant="mode === item.value ? 'solid' : 'outline'"
          @click="setMode(item.value as Mode)"
        />
      </div>
      <output
        class="text-highlighted font-mono text-7xl font-semibold tracking-tight tabular-nums"
        aria-live="polite"
        >{{ display }}</output
      >
      <UProgress
        :model-value="progress"
        color="primary"
        class="w-full"
        aria-label="Timer progress"
      />
      <div class="flex gap-2">
        <UButton
          v-if="!running"
          label="Start"
          icon="tabler:player-play-filled"
          @click="start"
        /><UButton
          v-else
          label="Pause"
          icon="tabler:player-pause"
          @click="pause"
        /><UButton
          label="Reset"
          color="neutral"
          variant="outline"
          icon="tabler:refresh"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
