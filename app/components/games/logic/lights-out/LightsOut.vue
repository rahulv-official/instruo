<script setup lang="ts">
type BoardSize = 5 | 6 | 7;
type CircuitMode = "daily" | "classic" | "progressive-6" | "progressive-7";
type GamePhase = "loading" | "ready" | "playing" | "won";
type SoundName = "on" | "off" | "win";
interface StreakRecord {
  date?: string;
  count?: number;
}

const hintPenalty = 2;
const selectedMode = ref<CircuitMode>("daily");
const dailyKey = ref("");
const phase = ref<GamePhase>("loading");
const board = shallowRef<boolean[]>([]);
const moves = ref(0);
const hintsUsed = ref(0);
const bestScore = ref<number | null>(null);
const dailyStreak = ref(0);
const optimalMoves = ref(0);
const loadingProgress = ref(18);
const pulseCells = ref<number[]>([]);
const showHint = ref(false);
const soundEnabled = ref(true);

let loadingTimer: ReturnType<typeof setTimeout> | undefined;
let pulseTimer: ReturnType<typeof setTimeout> | undefined;
let hintTimer: ReturnType<typeof setTimeout> | undefined;
let soundBank: Partial<Record<SoundName, HTMLAudioElement>> = {};
const soundSources: Record<SoundName, string> = {
  on: "/game-assets/kenney/ui/Sounds/switch-a.ogg",
  off: "/game-assets/kenney/ui/Sounds/switch-b.ogg",
  win: "/game-assets/kenney/interface-sounds/Audio/confirmation_001.ogg",
};

const modeOptions = [
  { label: "Daily Circuit · 5 × 5", value: "daily" as const },
  { label: "Classic · 5 × 5", value: "classic" as const },
  { label: "Progressive · 6 × 6", value: "progressive-6" as const },
  { label: "Progressive · 7 × 7", value: "progressive-7" as const },
];

const selectedModeModel = computed<CircuitMode>({
  get: () => selectedMode.value,
  set: (value) => {
    selectedMode.value = value;
    bestScore.value = readBestScore(value);
  },
});
const boardSize = computed<BoardSize>(() => {
  if (selectedMode.value === "progressive-6") return 6;
  if (selectedMode.value === "progressive-7") return 7;
  return 5;
});
const boardStyle = computed(() => ({
  gridTemplateColumns: `repeat(${boardSize.value}, minmax(0, 1fr))`,
}));
const selectedModeLabel = computed(
  () => modeOptions.find((option) => option.value === selectedMode.value)?.label ?? "Daily Circuit",
);
const modeSummary = computed(() => {
  if (selectedMode.value === "daily") return "A seeded 5 × 5 circuit shared by everyone today.";
  if (selectedMode.value === "classic") return "A fresh 5 × 5 practice board every time.";
  return `A larger ${boardSize.value} × ${boardSize.value} board for a longer solve.`;
});
const dailyDateLabel = computed(() => {
  if (!dailyKey.value) return "Today's circuit";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dailyKey.value}T00:00:00Z`));
});
const scoreMoves = computed(() => moves.value + hintsUsed.value * hintPenalty);
const scoreLabel = computed(
  () => `${scoreMoves.value} scored move${scoreMoves.value === 1 ? "" : "s"}`,
);
const isWon = computed(() => phase.value === "won");
const activeSolution = computed(() =>
  phase.value === "playing" ? solveBoard(board.value, boardSize.value) : [],
);
const hintIndex = computed(() => activeSolution.value[0] ?? null);
const statusText = computed(() => {
  if (phase.value === "loading") return "Warming the workshop console…";
  if (phase.value === "ready") return "A solvable circuit is ready.";
  if (phase.value === "won") {
    return `Circuit cleared in ${moves.value} move${moves.value === 1 ? "" : "s"}.`;
  }
  return "Turn every light off.";
});
const moveLabel = computed(() => `${moves.value} move${moves.value === 1 ? "" : "s"}`);
const bestLabel = computed(() =>
  bestScore.value === null ? "No best yet" : `Best ${bestScore.value}`,
);

function utcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function modeSeed(mode: CircuitMode) {
  if (mode === "daily") return hashSeed(`instruo-lights-out:${dailyKey.value || utcDayKey()}`);
  return Math.floor(Math.random() * 4294967296);
}

function affectedIndices(index: number, currentSize: BoardSize) {
  const row = Math.floor(index / currentSize);
  const column = index % currentSize;
  const targets = [
    [row, column],
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1],
  ];

  return targets
    .filter(
      ([targetRow, targetColumn]) =>
        targetRow !== undefined &&
        targetColumn !== undefined &&
        targetRow >= 0 &&
        targetRow < currentSize &&
        targetColumn >= 0 &&
        targetColumn < currentSize,
    )
    .map(([targetRow, targetColumn]) => targetRow! * currentSize + targetColumn!);
}

function applyMove(state: boolean[], index: number, currentSize: BoardSize) {
  for (const targetIndex of affectedIndices(index, currentSize))
    state[targetIndex] = !state[targetIndex];
}

function solveBoard(input: boolean[], currentSize: BoardSize) {
  let best: number[] | null = null;

  // Row chasing tries every first-row pattern and then extinguishes each lit
  // cell in the row above. This is exact for the five, six, and seven boards.
  for (let firstMask = 0; firstMask < 1 << currentSize; firstMask += 1) {
    const state = [...input];
    const solution: number[] = [];

    for (let column = 0; column < currentSize; column += 1) {
      if (firstMask & (1 << column)) {
        applyMove(state, column, currentSize);
        solution.push(column);
      }
    }

    for (let row = 1; row < currentSize; row += 1) {
      for (let column = 0; column < currentSize; column += 1) {
        const previousRowIndex = (row - 1) * currentSize + column;
        if (state[previousRowIndex]) {
          const index = row * currentSize + column;
          applyMove(state, index, currentSize);
          solution.push(index);
        }
      }
    }

    const lastRowStart = (currentSize - 1) * currentSize;
    const solved = state.slice(lastRowStart, lastRowStart + currentSize).every((cell) => !cell);
    if (solved && (!best || solution.length < best.length)) best = solution;
  }

  return best ?? [];
}

function makePuzzle(currentSize: BoardSize, seed: number) {
  const nextBoard = Array<boolean>(currentSize * currentSize).fill(false);
  const random = seededRandom(seed);
  const scrambleMoves = currentSize * 3 + 3 + Math.floor(random() * currentSize * 2);

  for (let index = 0; index < scrambleMoves; index += 1) {
    applyMove(nextBoard, Math.floor(random() * nextBoard.length), currentSize);
  }

  if (nextBoard.every((cell) => !cell)) applyMove(nextBoard, 0, currentSize);
  return nextBoard;
}

function readBestScore(mode: CircuitMode) {
  if (!import.meta.client) return null;
  const stored = Number(localStorage.getItem(`instruo-lights-out-best-${mode}`));
  return Number.isFinite(stored) && stored > 0 ? stored : null;
}

function readStreak() {
  if (!import.meta.client) return 0;
  try {
    const stored = JSON.parse(localStorage.getItem("instruo-lights-out-streak") ?? "null") as {
      count?: number;
    } | null;
    return stored?.count && stored.count > 0 ? stored.count : 0;
  } catch {
    return 0;
  }
}

function updateDailyStreak() {
  if (!import.meta.client || !dailyKey.value) return;
  const storageKey = "instruo-lights-out-streak";
  let previous: StreakRecord | null = null;
  try {
    previous = JSON.parse(localStorage.getItem(storageKey) ?? "null") as StreakRecord | null;
  } catch {
    previous = null;
  }

  if (previous?.date === dailyKey.value) return;
  const previousDate = previous?.date ? Date.parse(`${previous.date}T00:00:00Z`) : 0;
  const currentDate = Date.parse(`${dailyKey.value}T00:00:00Z`);
  const consecutive = currentDate - previousDate === 86400000;
  dailyStreak.value = consecutive ? (previous?.count ?? 0) + 1 : 1;
  localStorage.setItem(
    storageKey,
    JSON.stringify({ date: dailyKey.value, count: dailyStreak.value }),
  );
}

function initializeAudio() {
  if (!import.meta.client) return;

  soundEnabled.value = localStorage.getItem("instruo-lights-out-sound") !== "off";
  soundBank = Object.fromEntries(
    (Object.entries(soundSources) as [SoundName, string][]).map(([name, source]) => {
      const audio = new Audio(source);
      audio.preload = "auto";
      audio.volume = name === "win" ? 0.42 : 0.25;
      return [name, audio];
    }),
  ) as Partial<Record<SoundName, HTMLAudioElement>>;
}

function playSound(name: SoundName) {
  if (!soundEnabled.value) return;
  const audio = soundBank[name];
  if (!audio) return;

  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value;
  if (import.meta.client) {
    localStorage.setItem("instruo-lights-out-sound", soundEnabled.value ? "on" : "off");
  }
}

function markArtworkReady() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function startGame() {
  const puzzle = makePuzzle(boardSize.value, modeSeed(selectedMode.value));
  board.value = puzzle;
  optimalMoves.value = solveBoard(puzzle, boardSize.value).length;
  moves.value = 0;
  hintsUsed.value = 0;
  pulseCells.value = [];
  showHint.value = false;
  phase.value = "playing";
}

function toggle(index: number) {
  if (phase.value !== "playing") return;

  const affected = affectedIndices(index, boardSize.value);
  const nextBoard = [...board.value];
  applyMove(nextBoard, index, boardSize.value);
  board.value = nextBoard;
  moves.value += 1;
  playSound(nextBoard[index] ? "on" : "off");
  pulseCells.value = affected;
  showHint.value = false;
  if (pulseTimer) clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => {
    pulseCells.value = [];
  }, 300);

  if (nextBoard.every((cell) => !cell)) finishGame();
}

function useHint() {
  if (phase.value !== "playing" || hintIndex.value === null) return;
  hintsUsed.value += 1;
  showHint.value = true;
  if (hintTimer) clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    showHint.value = false;
  }, 1600);
}

function finishGame() {
  phase.value = "won";
  showHint.value = false;
  playSound("win");
  if (bestScore.value === null || scoreMoves.value < bestScore.value) {
    bestScore.value = scoreMoves.value;
    if (import.meta.client) {
      localStorage.setItem(
        `instruo-lights-out-best-${selectedMode.value}`,
        String(scoreMoves.value),
      );
    }
  }
  if (selectedMode.value === "daily") updateDailyStreak();
}

function reset() {
  if (phase.value === "loading") return;
  startGame();
}

onMounted(() => {
  initializeAudio();
  dailyKey.value = utcDayKey();
  bestScore.value = readBestScore(selectedMode.value);
  dailyStreak.value = readStreak();
  loadingTimer = setTimeout(markArtworkReady, 1100);
});

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
  if (pulseTimer) clearTimeout(pulseTimer);
  if (hintTimer) clearTimeout(hintTimer);
  for (const audio of Object.values(soundBank)) audio?.pause();
});
</script>

<template>
  <ToolWorkbench
    description="A workshop console where every switch changes its neighbors. Solve the circuit with the fewest scored moves."
  >
    <div class="grid min-w-0 gap-5">
      <section
        class="lights-out-stage relative isolate min-h-[34rem] overflow-hidden rounded-xl border border-black/20 bg-black shadow-xl shadow-black/20 sm:aspect-auto sm:min-h-[42rem] lg:aspect-video lg:min-h-0"
        aria-label="Lights Out workshop"
      >
        <img
          src="/game-arts/lights-out.jpg"
          alt="A young inventor working on a glowing workshop light panel"
          class="absolute inset-0 h-full w-full object-cover object-center"
          draggable="false"
          @load="markArtworkReady"
          @error="markArtworkReady"
        />
        <div class="absolute inset-0 bg-black/45" />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/45"
          aria-hidden="true"
        />

        <div
          v-if="phase === 'loading'"
          class="relative z-10 grid h-full place-items-center p-6 text-center text-white"
        >
          <div class="grid justify-items-center gap-4">
            <UIcon
              name="i-tabler-bulb"
              class="text-primary size-9 animate-pulse"
              aria-hidden="true"
            />
            <div>
              <p class="font-mono text-xs tracking-[0.24em] text-white/65 uppercase">
                Workshop console
              </p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Warming the lights
              </h2>
            </div>
            <UProgress
              :model-value="loadingProgress"
              color="primary"
              class="w-44"
              aria-label="Loading game"
            />
          </div>
        </div>

        <div
          v-else-if="phase === 'ready'"
          class="relative z-10 flex h-full items-end p-5 text-white sm:items-center sm:p-9"
        >
          <div class="grid w-full max-w-lg gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <UBadge
                :label="selectedModeLabel"
                color="primary"
                variant="subtle"
              />
              <span
                v-if="selectedMode === 'daily' && dailyStreak > 0"
                class="font-mono text-xs text-amber-100/75"
                >{{ dailyStreak }} day streak</span
              >
            </div>
            <div>
              <p class="font-mono text-xs tracking-[0.24em] text-white/65 uppercase">
                {{ dailyDateLabel }}
              </p>
              <h2 class="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">
                Power down the workshop.
              </h2>
            </div>
            <p class="max-w-md text-sm leading-6 text-white/75 sm:text-base">{{ modeSummary }}</p>
            <div class="grid gap-2 sm:max-w-xs">
              <UFormField
                label="Circuit mode"
                class="text-white"
              >
                <USelect
                  v-model="selectedModeModel"
                  :items="modeOptions"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <UButton
                label="Start circuit"
                icon="i-tabler-player-play"
                color="primary"
                size="lg"
                @click="startGame"
              />
              <span class="text-xs text-white/60">{{ bestLabel }} · runs locally</span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="relative z-10 flex h-full items-center justify-center p-3 sm:justify-end sm:p-6 lg:p-10"
        >
          <div
            class="lights-out-console relative grid w-full max-w-[28rem] gap-3 overflow-hidden rounded-2xl border border-amber-200/25 bg-black/75 p-3 text-white shadow-2xl shadow-black/45 backdrop-blur-sm sm:w-[54%] sm:max-w-md sm:gap-4 sm:p-5"
            :class="isWon ? 'lights-out-console--won' : ''"
          >
            <div :class="isWon ? 'blur-[2px]' : ''">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-mono text-[0.65rem] tracking-[0.2em] text-amber-100/60 uppercase">
                    {{ selectedModeLabel }}
                  </p>
                  <p
                    class="mt-1 truncate text-sm text-white/80"
                    role="status"
                    aria-live="polite"
                  >
                    {{ statusText }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <UButton
                    :icon="soundEnabled ? 'i-tabler-volume' : 'i-tabler-volume-off'"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :aria-label="soundEnabled ? 'Mute game sounds' : 'Unmute game sounds'"
                    :aria-pressed="soundEnabled"
                    class="text-white/75 hover:text-white"
                    @click="toggleSound"
                  />
                  <UBadge
                    :label="moveLabel"
                    color="neutral"
                    variant="subtle"
                    class="bg-white/10 text-white"
                  />
                </div>
              </div>

              <div
                class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/55"
              >
                <span>Par {{ optimalMoves }} · {{ scoreLabel }}</span>
                <span v-if="bestScore !== null">Best {{ bestScore }}</span>
              </div>

              <div
                class="mt-3 grid aspect-square gap-1 rounded-xl border border-amber-100/30 bg-amber-950/55 p-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_8px_24px_rgb(0_0_0/0.3)] sm:gap-1.5 sm:p-3"
                :style="boardStyle"
                aria-label="Lights Out board"
              >
                <button
                  v-for="(isOn, index) in board"
                  :key="index"
                  type="button"
                  class="lights-out-tile focus-visible:ring-primary grid min-h-0 min-w-0 place-items-center border-2 text-white transition-[border-color,box-shadow,transform] duration-150 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
                  :class="[
                    isOn
                      ? 'border-amber-100/90 text-amber-950'
                      : 'border-white/10 text-white/35 hover:border-white/30',
                    showHint && hintIndex === index ? 'ring-primary ring-2' : '',
                  ]"
                  :style="{ '--tile-index': index }"
                  :data-on="isOn"
                  :data-pulse="pulseCells.includes(index)"
                  :aria-label="`Light ${index + 1}, ${isOn ? 'on' : 'off'}`"
                  :aria-pressed="isOn"
                  :disabled="isWon"
                  @click="toggle(index)"
                >
                  <UIcon
                    :name="isOn ? 'i-tabler-bulb' : 'i-tabler-bulb-off'"
                    class="relative z-10"
                    :class="boardSize === 7 ? 'size-4 sm:size-5' : 'size-5 sm:size-6'"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div class="mt-3 grid gap-3">
                <p
                  v-if="showHint && hintIndex !== null"
                  class="text-xs text-amber-100/80"
                  role="status"
                  aria-live="polite"
                >
                  Try the highlighted switch. Hint adds {{ hintPenalty }} scored moves.
                </p>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <UButton
                    label="Hint"
                    icon="i-tabler-bulb"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    :disabled="hintIndex === null || isWon"
                    @click="useHint"
                  />
                  <UButton
                    label="Reset circuit"
                    icon="i-tabler-refresh"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="reset"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="isWon"
              class="absolute inset-0 z-20 grid place-items-center bg-black/65 p-5 text-center backdrop-blur-sm"
            >
              <div class="grid justify-items-center gap-3">
                <UIcon
                  name="i-tabler-bulb-off"
                  class="text-primary size-8"
                  aria-hidden="true"
                />
                <div>
                  <p class="font-mono text-xs tracking-[0.2em] text-white/60 uppercase">
                    Circuit clear
                  </p>
                  <h2 class="mt-1 text-2xl font-semibold">Workshop powered down.</h2>
                </div>
                <p class="text-sm text-white/70">
                  {{ scoreMoves }} scored moves · par {{ optimalMoves
                  }}<span v-if="hintsUsed">
                    · {{ hintsUsed }} hint{{ hintsUsed === 1 ? "" : "s" }}</span
                  >
                </p>
                <p
                  v-if="selectedMode === 'daily'"
                  class="font-mono text-xs text-amber-100/80"
                >
                  {{ dailyStreak }} day daily streak
                </p>
                <UButton
                  label="Play again"
                  icon="i-tabler-player-play"
                  color="primary"
                  @click="startGame"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-muted min-w-0 text-sm leading-6">
          Every board is generated from legal moves, so every circuit is solvable.
        </p>
        <span
          v-if="selectedMode === 'daily' && dailyStreak > 0"
          class="text-toned shrink-0 font-mono text-xs tabular-nums"
          >{{ dailyStreak }} day streak</span
        >
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.lights-out-tile {
  --tile-index: 0;
  position: relative;
  overflow: hidden;
  border-radius: 0.65rem;
  background: radial-gradient(
    circle at 34% 26%,
    rgb(125 84 49 / 0.55),
    rgb(38 25 17 / 0.94) 58%,
    rgb(10 8 7)
  );
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.1),
    inset 0 -5px 8px rgb(0 0 0 / 0.34),
    0 3px 0 rgb(0 0 0 / 0.28);
  transform: translateZ(0);
}

.lights-out-tile::before {
  position: absolute;
  inset: 11%;
  border-radius: 9999px;
  background: radial-gradient(circle at 32% 25%, rgb(255 255 255 / 0.42), transparent 22%);
  content: "";
  opacity: 0.28;
  pointer-events: none;
}

.lights-out-tile[data-on="true"] {
  background: radial-gradient(
    circle at 40% 34%,
    rgb(255 250 202),
    rgb(251 173 58 / 0.98) 46%,
    rgb(112 48 10)
  );
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.62),
    inset 0 -6px 10px rgb(126 48 8 / 0.28),
    0 0 16px rgb(251 146 60 / 0.62),
    0 4px 0 rgb(76 35 12 / 0.38);
}

.lights-out-tile[data-on="true"]::before {
  opacity: 0.9;
}

.lights-out-tile[data-pulse="true"] {
  animation: switch-pulse 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.lights-out-console--won .lights-out-tile {
  animation: win-cascade 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--tile-index) * 24ms);
}

@keyframes switch-pulse {
  0% {
    transform: translateZ(0) scale(0.96);
  }
  65% {
    transform: translateZ(0) scale(1.03);
  }
  100% {
    transform: translateZ(0) scale(1);
  }
}

@keyframes win-cascade {
  0% {
    filter: brightness(1);
    transform: translateY(0) scale(1);
  }
  45% {
    filter: brightness(1.65);
    transform: translateY(-2px) scale(1.04);
  }
  100% {
    filter: brightness(0.72);
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lights-out-tile[data-pulse="true"],
  .lights-out-console--won .lights-out-tile {
    animation: none;
  }
}
</style>
