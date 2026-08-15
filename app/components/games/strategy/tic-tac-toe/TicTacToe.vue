<script setup lang="ts">
type Mark = "O" | "X";
type Mode = "computer" | "local";

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const preferredMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
const modeOptions: { label: string; value: Mode; description: string }[] = [
  { label: "Vs computer", value: "computer", description: "You play X. The computer plays O." },
  { label: "Two players", value: "local", description: "Take turns on the same device." },
];

const board = shallowRef<(Mark | null)[]>(Array<Mark | null>(9).fill(null));
const mode = ref<Mode>("computer");
const computerThinking = ref(false);

const selectedMode = computed(() => modeOptions.find((option) => option.value === mode.value)!);
const line = computed(() => getWinningLine(board.value));
const winner = computed(() => (line.value ? board.value[line.value[0]!] : null));
const movesPlayed = computed(() => board.value.filter(Boolean).length);
const isDraw = computed(() => movesPlayed.value === 9 && !winner.value);
const currentMark = computed<Mark>(() => (movesPlayed.value % 2 === 0 ? "X" : "O"));
const finished = computed(() => Boolean(winner.value) || isDraw.value);
const playerLost = computed(() => mode.value === "computer" && winner.value === "O");
const playerWon = computed(() => mode.value === "computer" && winner.value === "X");
const status = computed(() => {
  if (winner.value) {
    if (mode.value === "computer") return winner.value === "X" ? "You win." : "Computer wins.";
    return `${winner.value} wins.`;
  }
  if (isDraw.value) return "Draw. Neither side found a line.";
  if (computerThinking.value) return "Computer is choosing a square.";
  if (mode.value === "computer") return "Your turn. Place X.";
  return `${currentMark.value}'s turn.`;
});

const { start: scheduleComputer, stop: cancelComputer } = useTimeoutFn(
  () => {
    const move = findBestMove(board.value);
    if (move !== -1) {
      const nextBoard = [...board.value];
      nextBoard[move] = "O";
      board.value = nextBoard;
    }
    computerThinking.value = false;
  },
  280,
  { immediate: false },
);

function getWinningLine(state: (Mark | null)[]) {
  return (
    winningLines.find(([first, second, third]) => {
      const mark = state[first!];
      return mark && mark === state[second!] && mark === state[third!];
    }) ?? null
  );
}

function scoreBoard(state: (Mark | null)[], depth: number): number | null {
  const winningLine = getWinningLine(state);
  if (winningLine) return state[winningLine[0]!] === "O" ? 10 - depth : depth - 10;
  if (state.every(Boolean)) return 0;
  return null;
}

function minimax(state: (Mark | null)[], maximizing: boolean, depth = 0): number {
  const score = scoreBoard(state, depth);
  if (score !== null) return score;

  const scores = preferredMoves
    .filter((index) => state[index] === null)
    .map((index) => {
      state[index] = maximizing ? "O" : "X";
      const nextScore = minimax(state, !maximizing, depth + 1);
      state[index] = null;
      return nextScore;
    });

  return maximizing ? Math.max(...scores) : Math.min(...scores);
}

function findBestMove(state: (Mark | null)[]) {
  let bestMove = -1;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const index of preferredMoves) {
    if (state[index] !== null) continue;
    const simulation = [...state];
    simulation[index] = "O";
    const score = minimax(simulation, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
}

function play(index: number) {
  if (board.value[index] || finished.value || computerThinking.value) return;

  const nextBoard = [...board.value];
  nextBoard[index] = currentMark.value;
  board.value = nextBoard;

  if (mode.value === "computer" && !getWinningLine(nextBoard) && nextBoard.some((cell) => !cell)) {
    computerThinking.value = true;
    scheduleComputer();
  }
}

function reset(nextMode = mode.value) {
  cancelComputer();
  mode.value = nextMode;
  computerThinking.value = false;
  board.value = Array<Mark | null>(9).fill(null);
}

function changeMode(value: string | undefined) {
  if (value !== "computer" && value !== "local") return;
  reset(value);
}
</script>

<template>
  <ToolWorkbench
    description="Make three in a row. Play another person or an unbeatable local computer opponent."
  >
    <div class="mx-auto grid max-w-xl gap-6">
      <div class="flex flex-col items-center gap-5">
        <p
          class="flex min-h-6 items-center gap-2 text-center font-medium"
          :class="
            playerLost
              ? 'text-error'
              : playerWon || (mode === 'local' && winner)
                ? 'text-success'
                : isDraw
                  ? 'text-warning'
                  : 'text-highlighted'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="playerLost"
            name="i-tabler-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="playerWon || (mode === 'local' && winner)"
            name="i-tabler-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="isDraw"
            name="i-tabler-circle-minus"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>

        <div
          class="grid h-[min(80vw,26rem)] w-[min(80vw,26rem)] grid-cols-3 grid-rows-3 border-2 transition-colors duration-200"
          :class="
            playerLost
              ? 'border-error'
              : playerWon || (mode === 'local' && winner)
                ? 'border-success'
                : isDraw
                  ? 'border-warning'
                  : 'border-inverted'
          "
          aria-label="Tic Tac Toe board"
        >
          <button
            v-for="(mark, index) in board"
            :key="index"
            type="button"
            class="focus-visible:ring-primary border-default/70 hover:bg-elevated/50 flex min-h-0 min-w-0 items-center justify-center overflow-hidden border-r border-b font-mono text-[clamp(2.5rem,12vw,4rem)] leading-none font-semibold transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none"
            :class="[
              index % 3 === 2 ? 'border-r-0' : '',
              index >= 6 ? 'border-b-0' : '',
              line?.includes(index) ? 'bg-success/15 text-success' : 'text-highlighted',
            ]"
            :disabled="Boolean(mark) || finished || computerThinking"
            :aria-label="mark ? `Square ${index + 1}, ${mark}` : `Square ${index + 1}, empty`"
            @click="play(index)"
          >
            <span class="block leading-none">{{ mark }}</span>
          </button>
        </div>
      </div>

      <div
        class="border-default/70 grid gap-4 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <UFormField
          label="Opponent"
          :description="selectedMode.description"
          :ui="{ container: 'mt-2' }"
        >
          <USelect
            :model-value="mode"
            :items="modeOptions"
            value-key="value"
            label-key="label"
            size="lg"
            class="w-full"
            @update:model-value="changeMode"
          />
        </UFormField>

        <UButton
          label="New round"
          color="neutral"
          variant="outline"
          icon="i-tabler-refresh"
          @click="reset()"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
