<script setup lang="ts">
type Level = "beginner" | "intermediate" | "hard";
type InputMode = "flag" | "reveal";
type GameStatus = "lost" | "playing" | "ready" | "won";

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
  description: `${option.rows} × ${option.columns}, ${option.mines} mines`,
}));

const level = ref<Level>("beginner");
const inputMode = ref<InputMode>("reveal");
const gameStatus = ref<GameStatus>("ready");
const elapsedSeconds = ref(0);
const cells = shallowRef<Cell[]>(createEmptyBoard(levelOptions.beginner));

const settings = computed(() => levelOptions[level.value]);
const flags = computed(() => cells.value.filter((cell) => cell.flagged).length);
const minesLeft = computed(() => settings.value.mines - flags.value);
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
const statusText = computed(() => {
  if (gameStatus.value === "won") return `Cleared in ${formattedTime.value}.`;
  if (gameStatus.value === "lost") return "A mine ended this board.";
  if (gameStatus.value === "ready") return "Choose any square to start. The first move is safe.";
  return inputMode.value === "flag" ? "Flag mode is active." : "Reveal every safe square.";
});
const boardStyle = computed(() => ({
  gridTemplateColumns: `repeat(${settings.value.columns}, minmax(0, 2rem))`,
}));

const { pause, resume } = useIntervalFn(
  () => {
    if (gameStatus.value === "playing") elapsedSeconds.value += 1;
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
}

function reveal(index: number) {
  const currentCell = cells.value[index];
  if (
    !currentCell ||
    currentCell.open ||
    currentCell.flagged ||
    gameStatus.value === "lost" ||
    gameStatus.value === "won"
  )
    return;

  if (gameStatus.value === "ready") {
    placeMines(index);
    gameStatus.value = "playing";
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
    gameStatus.value = "lost";
    pause();
    return;
  }

  const pending = [index];
  const visited = new Set<number>();
  while (pending.length) {
    const nextIndex = pending.pop()!;
    if (visited.has(nextIndex)) continue;
    visited.add(nextIndex);

    const cell = nextCells[nextIndex]!;
    if (cell.flagged || cell.mine) continue;
    cell.open = true;
    if (cell.adjacent === 0) {
      pending.push(...getNeighbors(nextIndex).filter((neighbor) => !visited.has(neighbor)));
    }
  }

  cells.value = nextCells;
  if (nextCells.every((cell) => cell.mine || cell.open)) {
    gameStatus.value = "won";
    pause();
  }
}

function toggleFlag(index: number) {
  if (gameStatus.value === "lost" || gameStatus.value === "won") return;
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

function reset(nextLevel = level.value) {
  pause();
  level.value = nextLevel;
  cells.value = createEmptyBoard(levelOptions[nextLevel]);
  gameStatus.value = "ready";
  elapsedSeconds.value = 0;
  inputMode.value = "reveal";
}

function changeLevel(value: string | undefined) {
  if (!value || !(value in levelOptions)) return;
  reset(value as Level);
}

function numberClass(value: number) {
  return {
    1: "text-primary",
    2: "text-success",
    3: "text-error",
    4: "text-info",
    5: "text-warning",
    6: "text-primary",
    7: "text-highlighted",
    8: "text-toned",
  }[value];
}
</script>

<template>
  <ToolWorkbench
    description="Clear the field without opening a mine. The first square and its neighbors are always safe."
  >
    <div class="grid gap-6">
      <div
        class="border-default/70 grid gap-4 border-b pb-4 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <p
          class="flex items-center gap-2 text-sm"
          :class="
            gameStatus === 'lost'
              ? 'text-error'
              : gameStatus === 'won'
                ? 'text-success'
                : 'text-toned'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="gameStatus === 'lost'"
            name="i-tabler-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="gameStatus === 'won'"
            name="i-tabler-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ statusText }}
        </p>
        <div class="flex gap-6 font-mono text-sm tabular-nums">
          <span>
            <strong class="text-highlighted">{{ minesLeft }}</strong>
            mines
          </span>
          <span>
            <strong class="text-highlighted">{{ formattedTime }}</strong>
            time
          </span>
        </div>
      </div>

      <div class="w-full overflow-x-auto pb-2">
        <div
          class="mx-auto grid w-max border-2 transition-colors duration-200"
          :class="
            gameStatus === 'lost'
              ? 'border-error'
              : gameStatus === 'won'
                ? 'border-success'
                : 'border-inverted'
          "
          :style="boardStyle"
          aria-label="Minesweeper board"
        >
          <button
            v-for="(cell, index) in cells"
            :key="index"
            type="button"
            class="focus-visible:ring-primary border-default/70 flex size-8 items-center justify-center border-r border-b font-mono text-sm font-semibold transition-colors duration-150 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none"
            :class="[
              cell.open ? 'bg-muted/30' : 'bg-default hover:bg-elevated/60',
              cell.mine && cell.open ? 'bg-error/15 text-error' : '',
              cell.adjacent && cell.open ? numberClass(cell.adjacent) : '',
            ]"
            :aria-label="
              cell.flagged
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
              class="text-primary size-4"
            />
            <UIcon
              v-else-if="cell.mine && cell.open"
              name="i-tabler-bomb"
              class="size-4"
            />
            <span v-else-if="cell.open && cell.adjacent">{{ cell.adjacent }}</span>
          </button>
        </div>
      </div>

      <div class="border-default/70 border-t pt-5">
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <UFormField
            label="Difficulty"
            :description="`${settings.rows} × ${settings.columns}, ${settings.mines} mines.`"
            :ui="{ container: 'mt-2' }"
          >
            <USelect
              :model-value="level"
              :items="levelItems"
              value-key="value"
              label-key="label"
              size="lg"
              class="w-full sm:max-w-sm"
              @update:model-value="changeLevel"
            />
          </UFormField>

          <div class="flex flex-wrap gap-2 sm:justify-end">
            <UButton
              label="Reveal"
              :color="inputMode === 'reveal' ? 'primary' : 'neutral'"
              :variant="inputMode === 'reveal' ? 'solid' : 'outline'"
              icon="i-tabler-pointer"
              class="sm:hidden"
              @click="inputMode = 'reveal'"
            />
            <UButton
              label="Flag"
              :color="inputMode === 'flag' ? 'primary' : 'neutral'"
              :variant="inputMode === 'flag' ? 'solid' : 'outline'"
              icon="i-tabler-flag"
              class="sm:hidden"
              @click="inputMode = 'flag'"
            />
            <UButton
              label="New board"
              color="neutral"
              variant="outline"
              icon="i-tabler-refresh"
              @click="reset()"
            />
          </div>
        </div>

        <p class="text-muted mt-4 text-sm leading-6">
          Desktop: left-click to reveal and right-click to flag. On touch screens, use the Reveal
          and Flag controls.
        </p>
      </div>
    </div>
  </ToolWorkbench>
</template>
