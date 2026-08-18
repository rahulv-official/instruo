<script setup lang="ts">
import { useIntervalFn } from "@vueuse/core";

type Level = "beginner" | "intermediate" | "hard";
type InputMode = "flag" | "reveal";
type GamePhase = "loading" | "ready" | "playing" | "won" | "lost";

interface Cell {
  adjacent: number;
  flagged: boolean;
  mine: boolean;
  open: boolean;
}

interface LevelOption {
  columns: number;
  label: string;
  mines: number;
  rows: number;
}

const levelOptions: Record<Level, LevelOption> = {
  beginner: { columns: 9, label: "Beginner", mines: 10, rows: 9 },
  intermediate: { columns: 16, label: "Intermediate", mines: 40, rows: 16 },
  hard: { columns: 30, label: "Hard", mines: 99, rows: 16 },
};
const levelEntries = Object.entries(levelOptions) as [Level, LevelOption][];
const levelItems = levelEntries.map(([value, option]) => ({
  label: option.label,
  value,
  description: `${option.rows} × ${option.columns} · ${option.mines} mines`,
}));

const level = ref<Level>("beginner");
const inputMode = ref<InputMode>("reveal");
const phase = ref<GamePhase>("loading");
const cells = shallowRef<Cell[]>(createEmptyBoard(levelOptions.beginner));
const elapsedSeconds = ref(0);
const minesPlaced = ref(false);
const loadingProgress = ref(12);
const pulseCells = ref<number[]>([]);
const blastIndex = ref<number | null>(null);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;
let pulseTimer: ReturnType<typeof setTimeout> | undefined;

const settings = computed(() => levelOptions[level.value]);
const flags = computed(() => cells.value.filter((cell) => cell.flagged).length);
const minesLeft = computed(() => settings.value.mines - flags.value);
const isFinished = computed(() => phase.value === "won" || phase.value === "lost");
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
const statusText = computed(() => {
  if (phase.value === "loading") return "Preparing the minefield";
  if (phase.value === "ready") return "Start with a safe first move";
  if (phase.value === "won") return `Field cleared in ${formattedTime.value}`;
  if (phase.value === "lost") return "Mine triggered · field compromised";
  return inputMode.value === "flag" ? "Flag mode active" : "Reveal safe squares";
});
const boardStyle = computed(() => ({
  gridTemplateColumns: `repeat(${settings.value.columns}, minmax(0, 1fr))`,
}));
const boardLabel = computed(
  () =>
    `${settings.value.label} board, ${settings.value.rows} rows and ${settings.value.columns} columns`,
);

const { pause, resume } = useIntervalFn(
  () => {
    if (phase.value === "playing" && minesPlaced.value) elapsedSeconds.value += 1;
  },
  1_000,
  { immediate: false },
);

function createEmptyBoard(option: LevelOption): Cell[] {
  return Array.from({ length: option.rows * option.columns }, () => ({
    adjacent: 0,
    flagged: false,
    mine: false,
    open: false,
  }));
}

function getNeighbors(index: number, option = settings.value) {
  const row = Math.floor(index / option.columns);
  const column = index % option.columns;
  const neighbors: number[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < option.rows && nextColumn >= 0 && nextColumn < option.columns) {
        neighbors.push(nextRow * option.columns + nextColumn);
      }
    }
  }

  return neighbors;
}

function placeMines(firstIndex: number) {
  const option = settings.value;
  const safeIndexes = new Set([firstIndex, ...getNeighbors(firstIndex, option)]);
  const candidates = Array.from(
    { length: option.rows * option.columns },
    (_, index) => index,
  ).filter((index) => !safeIndexes.has(index));

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [candidates[randomIndex]!, candidates[index]!];
  }

  const mineIndexes = new Set(candidates.slice(0, option.mines));
  cells.value = createEmptyBoard(option).map((cell, index) => ({
    ...cell,
    mine: mineIndexes.has(index),
    adjacent: getNeighbors(index, option).filter((neighbor) => mineIndexes.has(neighbor)).length,
  }));
  minesPlaced.value = true;
}

function markPulse(indexes: number[]) {
  pulseCells.value = indexes;
  if (pulseTimer) clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => {
    pulseCells.value = [];
  }, 360);
}

function reveal(index: number) {
  if (phase.value !== "playing") return;
  const currentCell = cells.value[index];
  if (!currentCell || currentCell.open || currentCell.flagged) return;

  if (!minesPlaced.value) {
    placeMines(index);
    resume();
  }

  const nextCells = cells.value.map((cell) => ({ ...cell }));
  const selected = nextCells[index]!;

  if (selected.mine) {
    nextCells.forEach((cell) => {
      if (cell.mine) cell.open = true;
    });
    selected.open = true;
    cells.value = nextCells;
    blastIndex.value = index;
    phase.value = "lost";
    pause();
    return;
  }

  const pending = [index];
  const visited = new Set<number>();
  const opened: number[] = [];
  while (pending.length) {
    const nextIndex = pending.pop()!;
    if (visited.has(nextIndex)) continue;
    visited.add(nextIndex);

    const cell = nextCells[nextIndex]!;
    if (cell.flagged || cell.mine) continue;
    cell.open = true;
    opened.push(nextIndex);
    if (cell.adjacent === 0) {
      pending.push(...getNeighbors(nextIndex).filter((neighbor) => !visited.has(neighbor)));
    }
  }

  cells.value = nextCells;
  markPulse(opened);
  if (nextCells.every((cell) => cell.mine || cell.open)) {
    phase.value = "won";
    pause();
  }
}

function toggleFlag(index: number) {
  if (phase.value !== "playing") return;
  const cell = cells.value[index];
  if (!cell || cell.open || (!cell.flagged && flags.value >= settings.value.mines)) return;

  const nextCells = cells.value.map((item) => ({ ...item }));
  nextCells[index]!.flagged = !nextCells[index]!.flagged;
  cells.value = nextCells;
}

function selectCell(index: number) {
  if (inputMode.value === "flag") toggleFlag(index);
  else reveal(index);
}

function begin() {
  pause();
  clearPulse();
  cells.value = createEmptyBoard(settings.value);
  minesPlaced.value = false;
  elapsedSeconds.value = 0;
  blastIndex.value = null;
  inputMode.value = "reveal";
  phase.value = "playing";
}

function reset(nextLevel = level.value) {
  pause();
  level.value = nextLevel;
  cells.value = createEmptyBoard(levelOptions[nextLevel]);
  minesPlaced.value = false;
  elapsedSeconds.value = 0;
  blastIndex.value = null;
  inputMode.value = "reveal";
  phase.value = "ready";
  clearPulse();
}

function changeLevel(value: string | undefined) {
  if (!value || !(value in levelOptions)) return;
  reset(value as Level);
}

function clearPulse() {
  pulseCells.value = [];
  if (pulseTimer) clearTimeout(pulseTimer);
  pulseTimer = undefined;
}

onMounted(() => {
  loadingTimer = setTimeout(finishLoading, 700);
});

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

onBeforeUnmount(() => {
  pause();
  clearPulse();
  if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
  <ToolWorkbench
    description="Read the numbers, mark the danger, and clear every safe square. Your first reveal is always safe."
  >
    <div class="minesweeper-game">
      <img
        src="/game-arts/minesweeper.jpg"
        alt="A playful minefield scanner with glowing numbered tiles"
        class="minesweeper-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="minesweeper-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="minesweeper-state"
      >
        <div class="minesweeper-state-copy">
          <UIcon
            name="i-tabler-bomb"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="minesweeper-eyebrow">Field scanner</p>
          <h2>Mapping the minefield</h2>
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
        class="minesweeper-state minesweeper-state--ready"
      >
        <div class="minesweeper-ready-copy">
          <UBadge
            label="Three field sizes"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="minesweeper-eyebrow">Mark · reveal · survive</p>
          <h2>Read the field.<br />Trust the numbers.</h2>
          <p>
            Choose a level, mark suspicious squares, and clear the field without touching a mine.
          </p>
          <UFormField
            label="Field difficulty"
            class="minesweeper-ready-field"
          >
            <USelect
              :model-value="level"
              :items="levelItems"
              value-key="value"
              label-key="label"
              size="lg"
              class="w-full sm:w-72"
              @update:model-value="changeLevel"
            />
          </UFormField>
          <UButton
            label="Start field"
            icon="i-tabler-player-play"
            color="primary"
            size="lg"
            @click="begin"
          />
        </div>
      </div>

      <div
        v-else
        class="minesweeper-layout"
      >
        <aside class="minesweeper-intro">
          <p class="minesweeper-eyebrow">Field protocol</p>
          <h2>Numbers reveal<br />the danger.</h2>
          <p>
            Each number counts mines touching that square. Empty cells fan open nearby safe ground.
          </p>
        </aside>

        <section
          class="minesweeper-console"
          :class="{
            'minesweeper-console--won': phase === 'won',
            'minesweeper-console--lost': phase === 'lost',
          }"
          aria-label="Minesweeper game"
        >
          <div
            class="minesweeper-console-body"
            :class="{ 'minesweeper-console-body--blurred': phase === 'won' }"
          >
            <header class="minesweeper-header">
              <div>
                <p class="minesweeper-eyebrow">{{ settings.label }} field</p>
                <p
                  class="minesweeper-status"
                  :data-phase="phase"
                  role="status"
                  aria-live="polite"
                >
                  {{ statusText }}
                </p>
              </div>
              <div class="minesweeper-stats">
                <span
                  ><strong>{{ minesLeft }}</strong> mines</span
                >
                <span
                  ><strong>{{ formattedTime }}</strong> time</span
                >
              </div>
            </header>

            <div class="minesweeper-board-meta">
              <span>{{ settings.rows }} × {{ settings.columns }}</span>
              <span>{{ flags }} flagged · {{ settings.mines }} total</span>
            </div>

            <div class="minesweeper-board-scroll">
              <div
                class="minesweeper-board"
                :class="{
                  'minesweeper-board--blast': phase === 'lost',
                  'minesweeper-board--clear': phase === 'won',
                }"
                :style="boardStyle"
                :aria-label="boardLabel"
              >
                <button
                  v-for="(cell, index) in cells"
                  :key="index"
                  type="button"
                  class="minesweeper-cell focus-visible:ring-primary"
                  :class="{
                    'minesweeper-cell--open': cell.open,
                    'minesweeper-cell--flagged': cell.flagged && !cell.open,
                    'minesweeper-cell--mine': cell.mine && cell.open,
                    'minesweeper-cell--pulse': pulseCells.includes(index),
                    'minesweeper-cell--blast': blastIndex === index,
                  }"
                  :data-number="cell.adjacent"
                  :style="{ '--cell-index': index }"
                  :disabled="isFinished"
                  :aria-label="
                    cell.flagged && !cell.open
                      ? `Square ${index + 1}, flagged`
                      : cell.open
                        ? `Square ${index + 1}, ${cell.mine ? 'mine' : cell.adjacent || 'empty'}`
                        : `Square ${index + 1}, hidden`
                  "
                  @click="selectCell(index)"
                  @contextmenu.prevent="toggleFlag(index)"
                >
                  <UIcon
                    v-if="cell.flagged && !cell.open"
                    name="i-tabler-flag"
                    class="minesweeper-cell-icon"
                    aria-hidden="true"
                  />
                  <UIcon
                    v-else-if="cell.mine && cell.open"
                    name="i-tabler-bomb"
                    class="minesweeper-cell-icon"
                    aria-hidden="true"
                  />
                  <span v-else-if="cell.open && cell.adjacent">{{ cell.adjacent }}</span>
                </button>
              </div>
            </div>

            <div class="minesweeper-controls">
              <div class="minesweeper-mode-controls">
                <UButton
                  label="Reveal"
                  icon="i-tabler-pointer"
                  :color="inputMode === 'reveal' ? 'primary' : 'neutral'"
                  :variant="inputMode === 'reveal' ? 'solid' : 'outline'"
                  size="sm"
                  @click="inputMode = 'reveal'"
                />
                <UButton
                  label="Flag"
                  icon="i-tabler-flag"
                  :color="inputMode === 'flag' ? 'primary' : 'neutral'"
                  :variant="inputMode === 'flag' ? 'solid' : 'outline'"
                  size="sm"
                  @click="inputMode = 'flag'"
                />
              </div>
              <div class="minesweeper-action-controls">
                <UButton
                  label="Change level"
                  icon="i-tabler-adjustments"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="reset()"
                />
                <UButton
                  label="New field"
                  icon="i-tabler-refresh"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="begin"
                />
              </div>
            </div>

            <p class="minesweeper-hint">
              Left-click reveals · right-click flags · touch uses the mode buttons
            </p>
          </div>

          <div
            v-if="isFinished"
            class="minesweeper-result"
            :class="{ 'minesweeper-result--lost': phase === 'lost' }"
          >
            <UIcon
              :name="phase === 'won' ? 'i-tabler-trophy' : 'i-tabler-bomb'"
              :class="phase === 'won' ? 'text-success' : 'text-error'"
              class="size-9"
              aria-hidden="true"
            />
            <p class="minesweeper-eyebrow">
              {{ phase === "won" ? "Field cleared" : "Field compromised" }}
            </p>
            <h2>{{ phase === "won" ? "Clean sweep." : "Mine triggered." }}</h2>
            <p>
              {{ phase === "won" ? `Cleared in ${formattedTime}.` : "Every mine is now marked." }}
            </p>
            <UButton
              label="Play again"
              icon="i-tabler-player-play"
              color="primary"
              @click="begin"
            />
          </div>
        </section>
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.minesweeper-game {
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

.minesweeper-art,
.minesweeper-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.minesweeper-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.minesweeper-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.3) 46%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.22);
}

.minesweeper-state,
.minesweeper-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.minesweeper-state {
  display: grid;
  place-items: center;
  color: white;
  text-align: center;
}

.minesweeper-state-copy,
.minesweeper-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.minesweeper-state-copy h2,
.minesweeper-ready-copy h2,
.minesweeper-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.minesweeper-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.minesweeper-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.minesweeper-ready-copy > p:not(.minesweeper-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.minesweeper-ready-field {
  width: 100%;
  color: white;
}

.minesweeper-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.minesweeper-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.minesweeper-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.minesweeper-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.minesweeper-console {
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

.minesweeper-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.minesweeper-header,
.minesweeper-board-meta,
.minesweeper-controls {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.minesweeper-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.minesweeper-status[data-phase="won"] {
  color: #86efac;
}

.minesweeper-status[data-phase="lost"] {
  color: #fca5a5;
}

.minesweeper-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem 0.7rem;
  color: rgb(255 255 255 / 0.5);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  text-align: right;
}

.minesweeper-stats strong {
  color: white;
  font-size: 1rem;
}

.minesweeper-board-meta {
  color: rgb(255 255 255 / 0.48);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.minesweeper-board-scroll {
  width: 100%;
  overflow: hidden;
  padding: 0.35rem 0.15rem 0.6rem;
}

.minesweeper-board {
  display: grid;
  width: 100%;
  max-width: 52rem;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgb(254 243 199 / 0.3);
  border-radius: 0.9rem;
  background: rgb(37 20 10 / 0.85);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 16px 35px rgb(0 0 0 / 0.3);
}

.minesweeper-cell {
  position: relative;
  display: grid;
  min-width: 0;
  aspect-ratio: 1;
  place-items: center;
  border-right: 1px solid rgb(255 255 255 / 0.09);
  border-bottom: 1px solid rgb(255 255 255 / 0.09);
  background: rgb(255 255 255 / 0.075);
  color: rgb(255 255 255 / 0.85);
  font-family: var(--font-mono);
  font-size: clamp(0.5rem, 1.5cqw, 0.9rem);
  font-weight: 700;
  transition:
    background-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.minesweeper-cell:hover:not(:disabled):not(.minesweeper-cell--open) {
  background: rgb(255 255 255 / 0.16);
}

.minesweeper-cell--open {
  background: rgb(255 255 255 / 0.035);
  color: rgb(255 255 255 / 0.8);
}

.minesweeper-cell--flagged {
  background: rgb(251 146 60 / 0.17);
  color: #fdba74;
}

.minesweeper-cell--mine {
  background: rgb(239 68 68 / 0.28);
  color: #fecaca;
}

.minesweeper-cell--blast {
  animation: mine-blast 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.minesweeper-cell--pulse {
  animation: reveal-pulse 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.minesweeper-cell-icon {
  width: clamp(0.5rem, 1.8cqw, 1.1rem);
  height: clamp(0.5rem, 1.8cqw, 1.1rem);
}

.minesweeper-cell[data-number="1"] {
  color: #7dd3fc;
}
.minesweeper-cell[data-number="2"] {
  color: #86efac;
}
.minesweeper-cell[data-number="3"] {
  color: #fca5a5;
}
.minesweeper-cell[data-number="4"] {
  color: #c4b5fd;
}
.minesweeper-cell[data-number="5"] {
  color: #fdba74;
}
.minesweeper-cell[data-number="6"] {
  color: #67e8f9;
}
.minesweeper-cell[data-number="7"] {
  color: white;
}
.minesweeper-cell[data-number="8"] {
  color: rgb(255 255 255 / 0.58);
}

.minesweeper-board--clear .minesweeper-cell--open {
  animation: clear-cascade 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--cell-index, 0) * 12ms);
}

.minesweeper-cell:nth-child(1) {
  --cell-index: 1;
}

.minesweeper-mode-controls,
.minesweeper-action-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.minesweeper-hint {
  margin: 0;
  color: rgb(255 255 255 / 0.42);
  font-size: 0.65rem;
  line-height: 1.5;
}

.minesweeper-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.minesweeper-result {
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

.minesweeper-result p:not(.minesweeper-eyebrow) {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
}

.minesweeper-result--lost {
  background: rgb(0 0 0 / 0.36);
  backdrop-filter: none;
}

@keyframes reveal-pulse {
  0% {
    box-shadow: inset 0 0 0 rgb(251 146 60 / 0);
    transform: scale(0.92);
  }
  100% {
    box-shadow: inset 0 0 18px rgb(251 146 60 / 0.2);
    transform: scale(1);
  }
}

@keyframes mine-blast {
  0%,
  100% {
    filter: brightness(1);
    transform: scale(1);
  }
  35% {
    filter: brightness(1.8) saturate(1.5);
    transform: scale(1.1);
  }
}

@keyframes clear-cascade {
  0% {
    filter: brightness(1);
    transform: translateY(0) scale(1);
  }
  45% {
    filter: brightness(1.5);
    transform: translateY(-2px) scale(1.04);
  }
  100% {
    filter: brightness(1);
    transform: translateY(0) scale(1);
  }
}

@container (min-width: 48rem) {
  .minesweeper-game {
    min-height: 36rem;
  }

  .minesweeper-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }

  .minesweeper-intro {
    display: block;
  }

  .minesweeper-console-body {
    gap: 1.2rem;
    padding: 1.4rem;
  }
}

@container (min-width: 72rem) {
  .minesweeper-layout {
    gap: 3rem;
    padding: 2.5rem;
  }

  .minesweeper-console-body {
    padding: 1.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .minesweeper-cell,
  .minesweeper-cell--blast,
  .minesweeper-cell--pulse,
  .minesweeper-board--clear .minesweeper-cell--open {
    animation: none;
    transition: none;
  }
}
</style>
