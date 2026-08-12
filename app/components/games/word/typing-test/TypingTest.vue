<script setup lang="ts">
const prompt = "Small tools make big tasks feel lighter.";
const input = ref("");
const seconds = ref(30);
const started = ref(false);
const finished = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
const progress = computed(() =>
  Math.min(100, Math.round((input.value.length / prompt.length) * 100)),
);
const words = computed(() => (input.value.trim() ? input.value.trim().split(/\s+/).length : 0));
const statusText = computed(() =>
  finished.value
    ? `Time. ${words.value} words typed.`
    : started.value
      ? `${seconds.value}s left. Keep typing.`
      : "Type the sentence before time runs out.",
);
function start() {
  if (started.value) return;
  started.value = true;
  timer = setInterval(() => {
    seconds.value -= 1;
    if (seconds.value <= 0) finish();
  }, 1000);
}
function finish() {
  if (timer) clearInterval(timer);
  timer = undefined;
  finished.value = true;
}
function reset() {
  if (timer) clearInterval(timer);
  timer = undefined;
  input.value = "";
  seconds.value = 30;
  started.value = false;
  finished.value = false;
}
onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<template>
  <ToolWorkbench
    description="Type the sentence accurately for 30 seconds. Everything stays in this tab."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <div class="flex items-center justify-between gap-4">
        <p
          class="text-toned text-sm"
          role="status"
          aria-live="polite"
        >
          {{ statusText }}
        </p>
        <span class="text-primary font-mono text-xl">{{ seconds }}s</span>
      </div>
      <div class="typing-copy border-default/70 bg-muted/20 border p-5 text-lg leading-8">
        <span class="text-highlighted">{{ prompt }}</span>
      </div>
      <UTextarea
        v-model="input"
        :rows="5"
        autoresize
        class="w-full"
        placeholder="Start typing here…"
        :disabled="finished"
        @focus="start"
        @input="start"
      />
      <UProgress
        :model-value="progress"
        :max="100"
        aria-label="Typing progress"
      />
      <div class="flex justify-between">
        <span class="text-muted font-mono text-sm">{{ words }} words</span
        ><UButton
          label="Reset"
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
.typing-copy {
  animation: typing-breathe 2.4s ease-in-out infinite alternate;
}
@keyframes typing-breathe {
  from {
    border-color: var(--ui-border);
  }
  to {
    border-color: var(--ui-color-primary-400);
  }
}
@media (prefers-reduced-motion: reduce) {
  .typing-copy {
    animation: none;
  }
}
</style>
