<script setup lang="ts">
type Player = "red" | "yellow";

const columns = 7;
const rows = 6;
const cells = Array.from({ length: rows * columns }, (_, index) => index);
const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const board = shallowRef<(Player | null)[]>(Array<Player | null>(rows * columns).fill(null));
const currentPlayer = ref<Player>("red");

const winningLine = computed(() => getWinningLine(board.value));
const winner = computed(() => (winningLine.value ? board.value[winningLine.value[0]!] : null));
const winningCells = computed(() => new Set(winningLine.value ?? []));
const moves = computed(() => board.value.filter(Boolean).length);
const isDraw = computed(() => moves.value === rows * columns && !winner.value);
const finished = computed(() => Boolean(winner.value) || isDraw.value);
const status = computed(() => {
  if (winner.value) return `${playerLabel(winner.value)} wins with four in a row.`;
  if (isDraw.value) return "Draw. The board is full.";
  return `${playerLabel(currentPlayer.value)} to drop a disc.`;
});

function playerLabel(player: Player) {
  return player === "red" ? "Red" : "Yellow";
}

function getWinningLine(state: (Player | null)[]) {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const player = state[row * columns + column];
      if (!player) continue;

      for (const [rowStep, columnStep] of directions) {
        const line = Array.from({ length: 4 }, (_, offset) => {
          const nextRow = row + rowStep! * offset;
          const nextColumn = column + columnStep! * offset;
          if (nextRow < 0 || nextRow >= rows || nextColumn < 0 || nextColumn >= columns) return -1;
          return nextRow * columns + nextColumn;
        });
        if (line.every((index) => index >= 0 && state[index] === player)) return line;
      }
    }
  }
  return null;
}

function canPlay(column: number) {
  return board.value[column] === null && !finished.value;
}

function drop(column: number) {
  if (!canPlay(column)) return;

  const nextBoard = [...board.value];
  for (let row = rows - 1; row >= 0; row -= 1) {
    const index = row * columns + column;
    if (nextBoard[index] === null) {
      nextBoard[index] = currentPlayer.value;
      break;
    }
  }
  board.value = nextBoard;
  if (!getWinningLine(nextBoard) && !nextBoard.every(Boolean)) {
    currentPlayer.value = currentPlayer.value === "red" ? "yellow" : "red";
  }
}

function reset() {
  board.value = Array<Player | null>(rows * columns).fill(null);
  currentPlayer.value = "red";
}

function discClass(player: Player | null) {
  if (player === "red") return "bg-error border-error";
  if (player === "yellow") return "bg-warning border-warning";
  return "border-default/70 bg-default";
}

if (import.meta.dev) {
  const check = Array<Player | null>(rows * columns).fill(null);
  check[35] = "red";
  check[36] = "red";
  check[37] = "red";
  check[38] = "red";
  if (getWinningLine(check)?.join(",") !== "35,36,37,38") {
    throw new Error("Connect Four line check failed");
  }
}
</script>

<template>
  <ToolWorkbench
    description="Drop discs into a seven-column board. First player to make four in a row wins."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex min-w-0 flex-1 items-center gap-2 text-sm leading-6"
          :class="
            winner
              ? winner === 'red'
                ? 'text-error'
                : 'text-warning'
              : isDraw
                ? 'text-warning'
                : 'text-toned'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="winner"
            :name="winner === 'red' ? 'i-lucide-circle-x' : 'i-lucide-circle-check'"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="isDraw"
            name="i-lucide-circle-minus"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm">{{ moves }}/42</span>
      </div>

      <div class="flex justify-center">
        <div
          class="bg-muted/30 grid aspect-[7/6] w-[min(100%,36rem)] grid-cols-7 grid-rows-6 border-2 p-1.5 sm:p-2"
          :class="
            winner
              ? winner === 'red'
                ? 'border-error'
                : 'border-warning'
              : isDraw
                ? 'border-warning'
                : 'border-inverted'
          "
          aria-label="Connect Four board"
        >
          <button
            v-for="index in cells"
            :key="index"
            type="button"
            class="focus-visible:ring-primary flex min-h-0 min-w-0 items-center justify-center p-1 transition-colors duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none sm:p-1.5"
            :disabled="!canPlay(index % columns)"
            :aria-label="`Column ${(index % columns) + 1}, row ${Math.floor(index / columns) + 1}${board[index] ? `, ${playerLabel(board[index]!)}` : ''}`"
            @click="drop(index % columns)"
          >
            <span
              class="size-[76%] rounded-full border-2 transition-[background-color,border-color,transform] duration-200"
              :class="[
                discClass(board[index] ?? null),
                winningCells.has(index) ? 'ring-success/20 scale-110 ring-4' : '',
              ]"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">
          Red starts. Play locally with another person on this device.
        </p>
        <UButton
          label="New round"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
