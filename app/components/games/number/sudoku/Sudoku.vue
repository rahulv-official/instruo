<script setup lang="ts">
import { getSudoku } from "sudoku-gen";

type Level = "beginner" | "intermediate" | "hard";
type Difficulty = "easy" | "medium" | "hard";

interface LevelOption {
  label: string;
  difficulty: Difficulty;
  empty: string;
  given: string;
}

const levelOptions: Record<Level, LevelOption> = {
  beginner: {
    label: "Beginner",
    difficulty: "easy",
    empty: "42 to 45 empty",
    given: "36 to 39 pre-filled",
  },
  intermediate: {
    label: "Intermediate",
    difficulty: "medium",
    empty: "49 to 51 empty",
    given: "30 to 32 pre-filled",
  },
  hard: {
    label: "Hard",
    difficulty: "hard",
    empty: "53 to 58 empty",
    given: "23 to 28 pre-filled",
  },
};

const level = ref<Level>("beginner");
const selectedCell = ref<number | null>(null);
const elapsedSeconds = ref(0);
const puzzle = shallowRef<number[]>([]);
const solution = shallowRef<number[]>([]);
const cells = shallowRef<number[]>([]);

const levelEntries = Object.entries(levelOptions) as [Level, LevelOption][];
const levelItems = levelEntries.map(([value, option]) => ({
  label: option.label,
  value,
  description: `${option.given}; ${option.empty}`,
}));
const selectedLevel = computed(() => levelOptions[level.value]);
const incorrectCells = computed(() => {
  return new Set(
    cells.value
      .map((value, index) => ({ index, value }))
      .filter(({ index, value }) => value !== 0 && value !== solution.value[index])
      .map(({ index }) => index),
  );
});
const completed = computed(
  () =>
    cells.value.length === 81 &&
    cells.value.every((value, index) => value === solution.value[index]),
);
const remaining = computed(() => cells.value.filter((value) => value === 0).length);
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

const { pause, resume } = useIntervalFn(
  () => {
    if (!completed.value) elapsedSeconds.value += 1;
  },
  1_000,
  { immediate: false },
);

function parseGrid(value: string) {
  return Array.from(value, (character) => (character === "-" ? 0 : Number(character)));
}

function isValidSolution(board: number[]) {
  if (board.length !== 81) return false;

  const expected = "123456789";
  const isCompleteGroup = (values: number[]) => [...values].sort().join("") === expected;

  for (let index = 0; index < 9; index += 1) {
    const row = board.slice(index * 9, index * 9 + 9);
    const column = Array.from({ length: 9 }, (_, rowIndex) => board[rowIndex * 9 + index]!);
    if (!isCompleteGroup(row) || !isCompleteGroup(column)) return false;
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) {
      const box: number[] = [];
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          box.push(board[(boxRow * 3 + row) * 9 + boxColumn * 3 + column]!);
        }
      }
      if (!isCompleteGroup(box)) return false;
    }
  }

  return true;
}

function getCandidates(board: number[], index: number) {
  const used = new Set<number>();
  const rowStart = Math.floor(index / 9) * 9;
  const column = index % 9;
  const boxRow = Math.floor(index / 27) * 3;
  const boxColumn = Math.floor(column / 3) * 3;

  for (let offset = 0; offset < 9; offset += 1) {
    used.add(board[rowStart + offset]!);
    used.add(board[offset * 9 + column]!);
    used.add(board[(boxRow + Math.floor(offset / 3)) * 9 + boxColumn + (offset % 3)]!);
  }

  return Array.from({ length: 9 }, (_, value) => value + 1).filter((value) => !used.has(value));
}

function countSolutions(source: number[], limit = 2) {
  const board = [...source];
  let total = 0;

  function solve() {
    if (total >= limit) return;

    let selectedIndex = -1;
    let selectedCandidates: number[] = [];

    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== 0) continue;
      const candidates = getCandidates(board, index);
      if (candidates.length === 0) return;
      if (selectedIndex === -1 || candidates.length < selectedCandidates.length) {
        selectedIndex = index;
        selectedCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }

    if (selectedIndex === -1) {
      total += 1;
      return;
    }

    for (const candidate of selectedCandidates) {
      board[selectedIndex] = candidate;
      solve();
      board[selectedIndex] = 0;
      if (total >= limit) return;
    }
  }

  solve();
  return total;
}

function createVerifiedPuzzle(selectedLevel: Level) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generated = getSudoku(levelOptions[selectedLevel].difficulty);
    const nextPuzzle = parseGrid(generated.puzzle);
    const nextSolution = parseGrid(generated.solution);
    const givensMatch = nextPuzzle.every(
      (value, index) => value === 0 || value === nextSolution[index],
    );

    if (isValidSolution(nextSolution) && givensMatch && countSolutions(nextPuzzle) === 1) {
      return { puzzle: nextPuzzle, solution: nextSolution };
    }
  }

  throw new Error("A verified Sudoku puzzle could not be generated.");
}

function isGiven(index: number) {
  return puzzle.value[index] !== 0;
}

function setNumber(value: number) {
  if (selectedCell.value === null || isGiven(selectedCell.value) || completed.value) return;

  const nextCells = [...cells.value];
  nextCells[selectedCell.value] = value;
  cells.value = nextCells;
  if (completed.value) pause();
}

function handleKeydown(event: KeyboardEvent) {
  const element = event.target as HTMLElement | null;
  if (element?.matches("input, textarea, [contenteditable='true']")) return;

  if (/^[1-9]$/.test(event.key)) setNumber(Number(event.key));
  else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") setNumber(0);
  else if (selectedCell.value !== null && event.key.startsWith("Arrow")) {
    event.preventDefault();
    const row = Math.floor(selectedCell.value / 9);
    const column = selectedCell.value % 9;
    const nextPosition = {
      ArrowDown: [Math.min(8, row + 1), column],
      ArrowLeft: [row, Math.max(0, column - 1)],
      ArrowRight: [row, Math.min(8, column + 1)],
      ArrowUp: [Math.max(0, row - 1), column],
    }[event.key];
    if (nextPosition) selectedCell.value = nextPosition[0]! * 9 + nextPosition[1]!;
  }
}

function loadPuzzle(selectedLevel = level.value) {
  const generated = createVerifiedPuzzle(selectedLevel);
  puzzle.value = generated.puzzle;
  solution.value = generated.solution;
  cells.value = [...generated.puzzle];
  selectedCell.value = null;
  elapsedSeconds.value = 0;
  resume();
}

function changeLevel(value: string | undefined) {
  if (!value || !(value in levelOptions)) return;
  const nextLevel = value as Level;
  level.value = nextLevel;
  loadPuzzle(nextLevel);
}

function reset() {
  cells.value = [...puzzle.value];
  selectedCell.value = null;
  elapsedSeconds.value = 0;
  resume();
}

useEventListener("keydown", handleKeydown);
onMounted(() => loadPuzzle());
</script>

<template>
  <ToolWorkbench
    description="Generated locally, then checked for a valid solution and a single answer."
  >
    <div class="grid gap-6">
      <div
        class="mx-auto grid w-full max-w-3xl gap-8 lg:grid-cols-[minmax(0,32rem)_1fr] lg:items-start"
      >
        <div>
          <div
            class="border-inverted grid aspect-square grid-cols-9 border-2"
            aria-label="Sudoku grid"
          >
            <button
              v-for="(value, index) in cells"
              :key="index"
              type="button"
              class="focus-visible:ring-primary border-default/70 relative flex items-center justify-center border-r border-b font-mono text-base font-medium tabular-nums focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none sm:text-xl"
              :class="[
                index % 9 === 2 || index % 9 === 5 ? 'border-r-inverted border-r-2' : '',
                Math.floor(index / 9) === 2 || Math.floor(index / 9) === 5
                  ? 'border-b-inverted border-b-2'
                  : '',
                selectedCell === index ? 'bg-primary/15 text-primary' : 'hover:bg-elevated/50',
                isGiven(index) ? 'bg-muted/40 text-highlighted font-semibold' : 'text-toned',
                incorrectCells.has(index) ? 'bg-error/15 text-error' : '',
              ]"
              :aria-label="`Row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}${value ? `, ${value}` : ', empty'}`"
              @click="selectedCell = index"
            >
              {{ value || "" }}
            </button>
          </div>
        </div>

        <div class="grid gap-6">
          <div class="border-default/70 grid grid-cols-2 border-b pb-5">
            <div>
              <p class="font-mono text-3xl tabular-nums">{{ formattedTime }}</p>
              <p class="text-muted mt-1 text-sm">elapsed time</p>
            </div>
            <div class="border-default/70 border-l pl-5">
              <p class="font-mono text-3xl tabular-nums">{{ remaining }}</p>
              <p class="text-muted mt-1 text-sm">empty squares</p>
            </div>
          </div>

          <UAlert
            v-if="completed"
            title="Puzzle complete"
            :description="`Solved in ${formattedTime}. Every row, column, and box is correct.`"
            color="success"
            variant="soft"
            icon="i-lucide-circle-check"
            :ui="{ root: 'rounded-none' }"
          />

          <div class="grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-3">
            <button
              v-for="number in 9"
              :key="number"
              type="button"
              class="focus-visible:ring-primary border-default/70 hover:bg-elevated/60 min-h-11 border font-mono font-semibold focus-visible:ring-2 focus-visible:outline-none"
              @click="setNumber(number)"
            >
              {{ number }}
            </button>
            <button
              type="button"
              class="focus-visible:ring-primary border-default/70 hover:bg-elevated/60 min-h-11 border font-mono text-xs focus-visible:ring-2 focus-visible:outline-none"
              @click="setNumber(0)"
            >
              CLEAR
            </button>
          </div>
        </div>
      </div>

      <div
        class="border-default/70 mx-auto grid w-full max-w-3xl gap-4 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <UFormField
          label="Difficulty"
          :description="`${selectedLevel.given}; ${selectedLevel.empty}.`"
          :ui="{ container: 'mt-2' }"
        >
          <USelect
            :model-value="level"
            :items="levelItems"
            value-key="value"
            label-key="label"
            size="lg"
            class="w-full sm:max-w-sm"
            :ui="{ base: 'rounded-none', content: 'rounded-none', item: 'before:rounded-none' }"
            @update:model-value="changeLevel"
          />
        </UFormField>

        <div class="flex flex-wrap gap-2 sm:justify-end">
          <UButton
            label="Reset"
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            @click="reset"
          />
          <UButton
            label="New puzzle"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="loadPuzzle()"
          />
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
