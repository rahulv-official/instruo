<script setup lang="ts">
type Phase = "between" | "idle" | "showing" | "playing" | "won" | "lost";
const pads = ["primary", "success", "warning", "error"] as const;
const sequence = ref<number[]>([]);
const activePad = ref<number | null>(null);
const inputIndex = ref(0);
const level = ref(0);
const phase = ref<Phase>("idle");
let timers: ReturnType<typeof setTimeout>[] = [];
let audioContext: AudioContext | null = null;

const padFrequencies = [293.66, 329.63, 392, 523.25];

function getAudioContext() {
  if (!import.meta.client) return null;
  if (!audioContext) {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return null;
    audioContext = new AudioContextConstructor();
  }
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function playPadSound(index: number, duration = 0.24) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = padFrequencies[index] ?? padFrequencies[0]!;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

const statusText = computed(() => {
  if (phase.value === "showing") return "Watch the pattern.";
  if (phase.value === "playing")
    return `Your turn. ${sequence.value.length - inputIndex.value} pads left.`;
  if (phase.value === "between") return "Nice run. Next pattern is loading…";
  if (phase.value === "won") return `Level ${level.value} complete. Keep going.`;
  if (phase.value === "lost") return "Pattern missed. Start a new run.";
  return "Repeat the pattern from memory.";
});

function clearTimers() {
  timers.forEach((timer) => clearTimeout(timer));
  timers = [];
}

function playSequence() {
  clearTimers();
  phase.value = "showing";
  inputIndex.value = 0;
  let index = 0;
  const showNext = () => {
    if (index >= sequence.value.length) {
      activePad.value = null;
      phase.value = "playing";
      return;
    }
    activePad.value = sequence.value[index]!;
    playPadSound(activePad.value, 0.34);
    timers.push(
      setTimeout(() => {
        activePad.value = null;
        timers.push(
          setTimeout(() => {
            index += 1;
            showNext();
          }, 120),
        );
      }, 420),
    );
  };
  showNext();
}

function start() {
  getAudioContext();
  level.value = 1;
  sequence.value = [Math.floor(Math.random() * pads.length)];
  playSequence();
}

function pressPad(index: number) {
  if (phase.value !== "playing") return;
  playPadSound(index);
  if (sequence.value[inputIndex.value] !== index) {
    phase.value = "lost";
    return;
  }
  inputIndex.value += 1;
  if (inputIndex.value < sequence.value.length) return;
  level.value += 1;
  sequence.value = [...sequence.value, Math.floor(Math.random() * pads.length)];
  phase.value = "between";
  activePad.value = null;
  timers.push(setTimeout(playSequence, 720));
}

onBeforeUnmount(() => {
  clearTimers();
  void audioContext?.close();
  audioContext = null;
});
</script>

<template>
  <ToolWorkbench description="Watch each color, then repeat the pattern in the same order.">
    <div class="mx-auto grid max-w-xl gap-6">
      <div class="border-default/70 flex items-center justify-between border-b pb-4">
        <p
          class="text-toned text-sm"
          role="status"
          aria-live="polite"
        >
          {{ statusText }}
        </p>
        <span class="text-toned font-mono text-sm">Level {{ level }}</span>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          v-for="(color, index) in pads"
          :key="color"
          type="button"
          class="simon-pad focus-visible:ring-primary grid aspect-square place-items-center border-2 text-sm font-semibold tracking-[0.16em] uppercase transition-transform duration-200 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
          :class="{
            'border-primary bg-primary/70 text-inverted': color === 'primary',
            'border-success bg-success/70 text-inverted': color === 'success',
            'border-warning bg-warning/70 text-highlighted': color === 'warning',
            'border-error bg-error/70 text-inverted': color === 'error',
          }"
          :data-active="activePad === index"
          :disabled="phase !== 'playing'"
          :aria-label="`Play ${color} pad`"
          @click="pressPad(index)"
        >
          <UIcon
            :name="`i-tabler-circle-number-${index + 1}`"
            class="size-7"
            aria-hidden="true"
          />
        </button>
      </div>
      <UButton
        :label="
          phase === 'playing' || phase === 'showing' || phase === 'between'
            ? 'Restart pattern'
            : 'Start game'
        "
        icon="i-tabler-player-play"
        size="xl"
        class="justify-center"
        @click="start"
      />
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.simon-pad[data-active="true"] {
  animation: simon-flash 320ms ease-out;
}
@keyframes simon-flash {
  50% {
    transform: scale(1.06);
    filter: brightness(1.35);
  }
}
@media (prefers-reduced-motion: reduce) {
  .simon-pad[data-active="true"] {
    animation: none;
  }
}
</style>
