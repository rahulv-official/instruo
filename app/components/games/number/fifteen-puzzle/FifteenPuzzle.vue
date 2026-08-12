<script setup lang="ts">
type GameStatus = "playing" | "ready" | "won";

const size = 4;
const tileCount = size * size;
const solvedBoard = Array.from({ length: tileCount }, (_, index) => (index + 1) % tileCount);

const board = shallowRef([...solvedBoard]);
const gameStatus = ref<GameStatus>("ready");
const moves = ref(0);
const elapsedSeconds = ref(0);

const blankIndex = computed(() => board.value.indexOf(0));
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
const status = computed(() => {
  if (gameStatus.value === "won")
    return `Solved in ${moves.value} moves and ${formattedTime.value}.`;
  if (gameStatus.value === "playing") return "Slide tiles into numerical order.";
  return "Move any tile next to the empty square.";
});

const { pause: pauseTimer, resume: startTimer } = useIntervalFn(
  () => {
    if (gameStatus.value === "playing") elapsedSeconds.value += 1;
  },
  1_000,
  { immediate: false },
);

function isAdjacent(first: number, second: number) {
  const firstRow = Math.floor(first / size);
  const secondRow = Math.floor(second / size);
  const firstColumn = first % size;
  const secondColumn = second % size;
  return Math.abs(firstRow - secondRow) + Math.abs(firstColumn - secondColumn) === 1;
}

function shuffleBoard(): number[] {
  const shuffled = [...solvedBoard];
  let currentBlank = tileCount - 1;

  for (let move = 0; move < 160; move += 1) {
    const options = [currentBlank - size, currentBlank + size, currentBlank - 1, currentBlank + 1]
      .filter((index) => index >= 0 && index < tileCount)
      .filter(
        (index) =>
          index % size === currentBlank % size ||
          Math.floor(index / size) === Math.floor(currentBlank / size),
      );
    const next = options[Math.floor(Math.random() * options.length)]!;
    [shuffled[currentBlank], shuffled[next]] = [shuffled[next]!, shuffled[currentBlank]!];
    currentBlank = next;
  }

  return shuffled.every((tile, index) => tile === solvedBoard[index]) ? shuffleBoard() : shuffled;
}

function moveTile(index: number) {
  if (gameStatus.value === "won" || !isAdjacent(index, blankIndex.value)) return;

  if (gameStatus.value === "ready") {
    gameStatus.value = "playing";
    startTimer();
  }

  const nextBoard = [...board.value];
  [nextBoard[index], nextBoard[blankIndex.value]] = [
    nextBoard[blankIndex.value]!,
    nextBoard[index]!,
  ];
  board.value = nextBoard;
  moves.value += 1;

  if (nextBoard.every((tile, tileIndex) => tile === solvedBoard[tileIndex])) {
    gameStatus.value = "won";
    pauseTimer();
  }
}

function reset() {
  pauseTimer();
  board.value = shuffleBoard();
  gameStatus.value = "ready";
  moves.value = 0;
  elapsedSeconds.value = 0;
}

if (import.meta.dev && new Set(solvedBoard).size !== tileCount) {
  throw new Error("15 Puzzle board check failed");
}

onMounted(reset);
</script>

<template>
  <ToolWorkbench
    description="Slide numbered tiles into order. Every shuffled board is made from legal moves, so it can be solved."
  >
    <div class="mx-auto grid max-w-xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="gameStatus === 'won' ? 'text-success' : 'text-toned'"
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="gameStatus === 'won'"
            name="i-lucide-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>
        <div class="text-toned flex shrink-0 gap-4 font-mono text-sm tabular-nums">
          <span>{{ moves }} moves</span>
          <span>{{ formattedTime }}</span>
        </div>
      </div>

      <div class="flex justify-center">
        <div
          class="bg-muted/30 grid aspect-square w-[min(92vw,28rem)] grid-cols-4 gap-1.5 border-2 p-1.5 sm:gap-2 sm:p-2"
          :class="gameStatus === 'won' ? 'border-success' : 'border-inverted'"
          aria-label="15 Puzzle board"
        >
          <button
            v-for="(tile, index) in board"
            :key="tile"
            type="button"
            class="focus-visible:ring-primary flex min-h-0 min-w-0 items-center justify-center border font-mono text-xl font-semibold transition-[background-color,border-color,transform] duration-150 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.96] sm:text-2xl"
            :class="
              tile
                ? isAdjacent(index, blankIndex)
                  ? 'border-primary bg-primary/10 text-highlighted hover:bg-primary/15'
                  : 'border-default/70 bg-default text-highlighted'
                : 'border-transparent bg-transparent text-transparent'
            "
            :disabled="!tile || gameStatus === 'won'"
            :aria-label="tile ? `Move tile ${tile}` : 'Empty square'"
            @click="moveTile(index)"
          >
            {{ tile || "" }}
          </button>
        </div>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">Only tiles beside the empty square can move.</p>
        <UButton
          label="New puzzle"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
