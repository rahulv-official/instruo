<script setup lang="ts">
type GameState = "idle" | "waiting" | "ready" | "result" | "false-start";

const gameState = ref<GameState>("idle");
const reactionMs = ref<number | null>(null);
const bestMs = ref<number | null>(null);
const startedAt = ref(0);
let timer: ReturnType<typeof setTimeout> | undefined;

const stageLabel = computed(() => {
  if (gameState.value === "waiting") return "Wait for green";
  if (gameState.value === "ready") return "Click now";
  if (gameState.value === "result") return `${reactionMs.value} ms`;
  if (gameState.value === "false-start") return "Too soon";
  return "Start round";
});
const stageHint = computed(() => {
  if (gameState.value === "waiting") return "Wait for the green signal.";
  if (gameState.value === "ready") return "Click as soon as you see green.";
  if (gameState.value === "result") return "Click to start another round.";
  if (gameState.value === "false-start") return "Click to try again.";
  return "Click to begin.";
});

const statusText = computed(() => {
  if (gameState.value === "waiting") return "Wait. Clicking early starts over.";
  if (gameState.value === "ready") return "Click the panel as soon as it turns green.";
  if (gameState.value === "result")
    return `Your reaction time was ${reactionMs.value} milliseconds.`;
  if (gameState.value === "false-start") return "You clicked before the signal. Try again.";
  return "Measure one clean reaction. No account or score upload.";
});

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = undefined;
}

function startRound() {
  clearTimer();
  reactionMs.value = null;
  gameState.value = "waiting";
  const delay = 1_400 + Math.floor(Math.random() * 1_800);
  timer = setTimeout(() => {
    gameState.value = "ready";
    startedAt.value = performance.now();
  }, delay);
}

function clickStage() {
  if (
    gameState.value === "idle" ||
    gameState.value === "result" ||
    gameState.value === "false-start"
  ) {
    startRound();
    return;
  }

  if (gameState.value === "waiting") {
    clearTimer();
    gameState.value = "false-start";
    return;
  }

  reactionMs.value = Math.round(performance.now() - startedAt.value);
  bestMs.value =
    bestMs.value === null ? reactionMs.value : Math.min(bestMs.value, reactionMs.value);
  gameState.value = "result";
}

function handleKeydown(event: KeyboardEvent) {
  if (event.code !== "Space") return;
  const element = event.target as HTMLElement | null;
  if (element?.matches("input, textarea, select, button, [contenteditable='true']")) return;
  event.preventDefault();
  clickStage();
}

useEventListener("keydown", handleKeydown);
onBeforeUnmount(clearTimer);
</script>

<template>
  <ToolWorkbench
    description="Wait for the signal, then click or press Space as quickly as you can."
  >
    <div class="mx-auto grid max-w-xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="text-toned flex items-center gap-2 text-sm leading-6"
          :class="
            gameState === 'false-start'
              ? 'text-error'
              : gameState === 'result'
                ? 'text-success'
                : ''
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="gameState === 'false-start'"
            name="i-lucide-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="gameState === 'result'"
            name="i-lucide-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ statusText }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm tabular-nums">
          Best {{ bestMs === null ? "--" : `${bestMs} ms` }}
        </span>
      </div>

      <button
        type="button"
        class="reaction-stage focus-visible:ring-primary grid min-h-72 place-items-center border-2 p-8 text-center transition-transform duration-300 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.99]"
        :class="{
          'border-inverted bg-muted/20 text-highlighted':
            gameState === 'idle' || gameState === 'result',
          'border-warning bg-warning/10 text-warning': gameState === 'waiting',
          'border-success bg-success text-inverted': gameState === 'ready',
          'border-error bg-error/10 text-error': gameState === 'false-start',
        }"
        :data-state="gameState"
        aria-keyshortcuts="Space"
        @click="clickStage"
      >
        <span class="grid gap-3">
          <strong class="text-3xl font-semibold tracking-tight sm:text-4xl">{{
            stageLabel
          }}</strong>
          <span class="text-sm leading-6">{{ stageHint }}</span>
        </span>
      </button>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">
          Average human reaction time is roughly 200 to 250 ms.
        </p>
        <UButton
          label="New round"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="startRound"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.reaction-stage[data-state="ready"] {
  animation: reaction-ready 1.25s ease-in-out infinite alternate;
}

@keyframes reaction-ready {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.012);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reaction-stage[data-state="ready"] {
    animation: none;
  }
}
</style>
