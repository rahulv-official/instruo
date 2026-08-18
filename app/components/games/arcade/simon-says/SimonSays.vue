<script setup lang="ts">
type GamePhase = "loading" | "ready" | "showing" | "playing" | "between" | "lost";

const pads = [
  { label: "Red", tone: "red", frequency: 392 },
  { label: "Blue", tone: "blue", frequency: 493.88 },
  { label: "Green", tone: "green", frequency: 587.33 },
  { label: "Yellow", tone: "yellow", frequency: 698.46 },
] as const;
const phase = ref<GamePhase>("loading");
const sequence = ref<number[]>([]);
const activePad = ref<number | null>(null);
const inputIndex = ref(0);
const level = ref(0);
const bestLevel = ref(0);
const loadingProgress = ref(12);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;
let activeTimer: ReturnType<typeof setTimeout> | undefined;
let sequenceTimers: ReturnType<typeof setTimeout>[] = [];
let audioContext: AudioContext | null = null;

const isBusy = computed(() => phase.value === "showing" || phase.value === "between");
const isLost = computed(() => phase.value === "lost");
const statusText = computed(() => {
  if (phase.value === "loading") return "Preparing the signal board";
  if (phase.value === "ready") return "Repeat the pattern from memory";
  if (phase.value === "showing")
    return `Watch ${sequence.value.length} signal${sequence.value.length === 1 ? "" : "s"}`;
  if (phase.value === "between") return "Pattern complete · next signal incoming";
  if (phase.value === "lost") return `Signal lost on level ${level.value}`;
  return `${inputIndex.value} of ${sequence.value.length} repeated`;
});
const progressLabel = computed(() => `${inputIndex.value}/${sequence.value.length}`);

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
  oscillator.frequency.value = pads[index]?.frequency ?? pads[0].frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.14, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playMissSound() {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(180, start);
  oscillator.frequency.exponentialRampToValueAtTime(90, start + 0.22);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.11, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.26);
}

function clearTimers() {
  sequenceTimers.forEach((timer) => clearTimeout(timer));
  sequenceTimers = [];
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = undefined;
  activePad.value = null;
}

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
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

    const pad = sequence.value[index]!;
    activePad.value = pad;
    playPadSound(pad, 0.28);
    sequenceTimers.push(
      setTimeout(() => {
        activePad.value = null;
        sequenceTimers.push(
          setTimeout(() => {
            index += 1;
            showNext();
          }, 130),
        );
      }, 380),
    );
  };

  showNext();
}

function start() {
  clearTimers();
  getAudioContext();
  level.value = 1;
  sequence.value = [Math.floor(Math.random() * pads.length)];
  playSequence();
}

function pressPad(index: number) {
  if (phase.value !== "playing") return;
  playPadSound(index);
  activePad.value = index;
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    activePad.value = null;
  }, 180);

  if (sequence.value[inputIndex.value] !== index) {
    clearTimers();
    playMissSound();
    bestLevel.value = Math.max(bestLevel.value, level.value);
    if (import.meta.client) localStorage.setItem("instruo-simon-best", String(bestLevel.value));
    phase.value = "lost";
    return;
  }

  inputIndex.value += 1;
  if (inputIndex.value < sequence.value.length) return;

  level.value += 1;
  bestLevel.value = Math.max(bestLevel.value, level.value);
  if (import.meta.client) localStorage.setItem("instruo-simon-best", String(bestLevel.value));
  sequence.value = [...sequence.value, Math.floor(Math.random() * pads.length)];
  phase.value = "between";
  sequenceTimers.push(setTimeout(playSequence, 760));
}

onMounted(() => {
  bestLevel.value = Number(localStorage.getItem("instruo-simon-best") ?? 0);
  loadingTimer = setTimeout(finishLoading, 700);
});

onBeforeUnmount(() => {
  clearTimers();
  if (loadingTimer) clearTimeout(loadingTimer);
  void audioContext?.close();
  audioContext = null;
});
</script>

<template>
  <ToolWorkbench
    description="Watch each signal, then repeat the pattern in the same order as it grows."
  >
    <div class="simon-game">
      <img
        src="/game-arts/simon-says.jpg"
        alt="A playful electronic memory game with four glowing signal pads"
        class="simon-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="simon-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="simon-state"
      >
        <div class="simon-state-copy">
          <UIcon
            name="i-tabler-brain"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="simon-eyebrow">Signal board</p>
          <h2>Waking the sequence</h2>
          <UProgress
            :model-value="loadingProgress"
            color="primary"
            class="w-48"
            aria-label="Loading game"
          />
        </div>
      </div>

      <div
        v-else-if="phase === 'ready'"
        class="simon-state simon-state--ready"
      >
        <div class="simon-ready-copy">
          <UBadge
            label="Endless memory run"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="simon-eyebrow">Watch · remember · repeat</p>
          <h2>Hold the pattern.<br />Trust your memory.</h2>
          <p>Four sounds. One growing sequence. A single wrong pad ends the run.</p>
          <UButton
            label="Start sequence"
            icon="i-tabler-player-play"
            color="primary"
            size="lg"
            @click="start"
          />
        </div>
      </div>

      <div
        v-else
        class="simon-layout"
      >
        <aside class="simon-intro">
          <p class="simon-eyebrow">Memory circuit</p>
          <h2>Listen close.<br />Move clean.</h2>
          <p>
            The pause between rounds is intentional. Let the sequence finish, then repeat every
            signal from its first beat.
          </p>
        </aside>

        <section
          class="simon-console"
          :class="{ 'simon-console--done': isLost }"
          aria-label="Simon Says memory game"
        >
          <div
            class="simon-console-body"
            :class="{ 'simon-console-body--blurred': isLost }"
          >
            <header class="simon-header">
              <div>
                <p class="simon-eyebrow">Simon says</p>
                <p
                  class="simon-status"
                  role="status"
                  aria-live="polite"
                >
                  {{ statusText }}
                </p>
              </div>
              <div class="simon-score">
                <span>Level</span>
                <strong>{{ level }}</strong>
                <span>Best {{ bestLevel }}</span>
              </div>
            </header>

            <div class="simon-progress-row">
              <span>Pattern {{ sequence.length }}</span>
              <span>{{ isBusy ? "Watch" : progressLabel }}</span>
            </div>
            <div
              class="simon-progress"
              role="progressbar"
              :aria-valuenow="inputIndex"
              aria-valuemin="0"
              :aria-valuemax="sequence.length"
              :aria-label="`${inputIndex} of ${sequence.length} signals repeated`"
            >
              <span
                :style="{ width: `${sequence.length ? (inputIndex / sequence.length) * 100 : 0}%` }"
              />
            </div>

            <div
              class="simon-board"
              aria-label="Simon Says signal pads"
            >
              <button
                v-for="(pad, index) in pads"
                :key="pad.tone"
                type="button"
                class="simon-pad focus-visible:ring-primary"
                :class="{ 'simon-pad--active': activePad === index }"
                :data-pad="pad.tone"
                :disabled="phase !== 'playing'"
                :aria-label="`${pad.label} pad${activePad === index ? ', active' : ''}`"
                @click="pressPad(index)"
              >
                <UIcon
                  :name="`i-tabler-circle-number-${index + 1}`"
                  class="simon-pad-icon"
                  aria-hidden="true"
                />
                <span>{{ pad.label }}</span>
              </button>
            </div>

            <footer class="simon-footer">
              <p>Sound and keyboard-free touch play. Wait for your turn.</p>
              <UButton
                label="Restart run"
                color="neutral"
                variant="ghost"
                icon="i-tabler-refresh"
                size="sm"
                @click="start"
              />
            </footer>
          </div>

          <div
            v-if="isLost"
            class="simon-result"
          >
            <UIcon
              name="i-tabler-alert-triangle"
              class="text-error size-9"
              aria-hidden="true"
            />
            <p class="simon-eyebrow">Signal lost</p>
            <h2>Pattern broken.</h2>
            <p>
              You reached level <strong>{{ level }}</strong
              >.
            </p>
            <UButton
              label="Try again"
              icon="i-tabler-player-play"
              color="primary"
              @click="start"
            />
          </div>
        </section>
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.simon-game {
  --simon-accent: #fb923c;
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  min-height: 42rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 1.25rem;
  background: #0b0d12;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.28);
}

.simon-art,
.simon-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.simon-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.simon-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.3) 46%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.22);
}

.simon-state,
.simon-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.simon-state {
  display: grid;
  place-items: center;
  color: white;
  text-align: center;
}

.simon-state-copy,
.simon-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.simon-state-copy h2,
.simon-ready-copy h2,
.simon-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.simon-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.simon-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.simon-ready-copy > p:not(.simon-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.simon-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.simon-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.simon-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.simon-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.simon-console {
  position: relative;
  min-width: 0;
  align-self: center;
  border: 1px solid rgb(254 243 199 / 0.25);
  border-radius: 1rem;
  background: rgb(0 0 0 / 0.75);
  color: white;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(4px);
}

.simon-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.simon-header,
.simon-progress-row,
.simon-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.simon-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.2rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.simon-score {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 0.3rem 0.5rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.08);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: rgb(255 255 255 / 0.55);
}

.simon-score strong {
  color: white;
  font-size: 1.05rem;
  grid-row: span 2;
}

.simon-progress-row {
  color: rgb(255 255 255 / 0.5);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.simon-progress {
  height: 0.35rem;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.1);
}

.simon-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--simon-accent);
  transition: width 180ms ease-out;
}

.simon-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.simon-pad {
  display: grid;
  min-height: 8rem;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 0.9rem;
  color: white;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
  text-transform: uppercase;
  transition:
    filter 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.simon-pad[data-pad="red"] {
  --pad-glow: rgb(255 48 26 / 0.8);
  background: radial-gradient(circle at 35% 25%, #ff7855, #f52d1c 45%, #a80d18);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.4),
    inset 0 -8px 12px rgb(114 0 8 / 0.35),
    0 5px 0 rgb(88 8 14 / 0.55);
}
.simon-pad[data-pad="blue"] {
  --pad-glow: rgb(31 146 255 / 0.8);
  background: radial-gradient(circle at 35% 25%, #78e1ff, #159bff 45%, #0054bd);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.4),
    inset 0 -8px 12px rgb(0 49 137 / 0.35),
    0 5px 0 rgb(0 54 129 / 0.55);
}
.simon-pad[data-pad="green"] {
  --pad-glow: rgb(95 255 53 / 0.8);
  background: radial-gradient(circle at 35% 25%, #d3ff78, #65e918 45%, #0a9c33);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.4),
    inset 0 -8px 12px rgb(0 90 35 / 0.35),
    0 5px 0 rgb(0 90 31 / 0.55);
}
.simon-pad[data-pad="yellow"] {
  --pad-glow: rgb(255 194 35 / 0.82);
  color: #3b2500;
  background: radial-gradient(circle at 35% 25%, #fff3a3, #ffc51d 45%, #dc7200);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.45),
    inset 0 -8px 12px rgb(152 70 0 / 0.3),
    0 5px 0 rgb(145 71 0 / 0.55);
}

.simon-pad:hover:not(:disabled) {
  filter: brightness(1.12);
}

.simon-pad:active:not(:disabled) {
  transform: translateY(1px);
}

.simon-pad:disabled {
  cursor: not-allowed;
}

.simon-pad--active {
  animation: simon-neon-pulse 380ms ease-out;
  filter: brightness(1.42) saturate(1.3);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--pad-glow) 82%, transparent),
    0 0 4px var(--pad-glow),
    0 0 12px var(--pad-glow),
    0 0 30px 6px var(--pad-glow),
    0 0 74px 18px color-mix(in srgb, var(--pad-glow) 72%, transparent),
    0 5px 0 rgb(0 0 0 / 0.3);
  transform: translateY(-1px);
}

.simon-pad[data-pad="yellow"].simon-pad--active {
  text-shadow: 0 1px 2px rgb(255 194 35 / 0.75);
}

@keyframes simon-neon-pulse {
  0% {
    filter: brightness(1.1) saturate(1.1);
  }
  42% {
    filter: brightness(1.75) saturate(1.45);
  }
  100% {
    filter: brightness(1.42) saturate(1.3);
  }
}

.simon-pad-icon {
  width: 2rem;
  height: 2rem;
}

.simon-footer {
  align-items: center;
  padding-top: 0.2rem;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.simon-footer p {
  margin: 0;
  color: rgb(255 255 255 / 0.42);
  font-size: 0.65rem;
  line-height: 1.5;
}

.simon-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.simon-result {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.7rem;
  padding: 1.5rem;
  border-radius: inherit;
  background: rgb(0 0 0 / 0.65);
  color: white;
  text-align: center;
  backdrop-filter: blur(8px);
}

.simon-result p:not(.simon-eyebrow) {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
}

.simon-result strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.2rem;
}

@container (min-width: 48rem) {
  .simon-game {
    min-height: 36rem;
  }

  .simon-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }

  .simon-intro {
    display: block;
  }

  .simon-console-body {
    gap: 1.2rem;
    padding: 1.4rem;
  }
}

@container (min-width: 72rem) {
  .simon-layout {
    gap: 3rem;
    padding: 2.5rem;
  }

  .simon-console-body {
    padding: 1.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .simon-progress span,
  .simon-pad,
  .simon-pad--active {
    animation: none;
    transition: none;
  }
}
</style>
