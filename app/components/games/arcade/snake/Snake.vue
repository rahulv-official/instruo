<script setup lang="ts">
type Direction = "down" | "left" | "right" | "up";
type GameStatus = "lost" | "paused" | "playing" | "ready" | "won";
type Speed = "classic" | "fast" | "relaxed";

const boardSize = 20;
const cellCount = boardSize * boardSize;
const cells = Array.from({ length: cellCount }, (_, index) => index);
const speedOptions: { label: string; value: Speed; description: string; interval: number }[] = [
  { label: "Relaxed", value: "relaxed", description: "A forgiving 180 ms step.", interval: 180 },
  { label: "Classic", value: "classic", description: "A steady 120 ms step.", interval: 120 },
  { label: "Fast", value: "fast", description: "A sharp 75 ms step.", interval: 75 },
];
const keyDirections: Record<string, Direction> = {
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  a: "left",
  d: "right",
  s: "down",
  w: "up",
};
const vectors: Record<Direction, [number, number]> = {
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
  up: [-1, 0],
};
const opposites: Record<Direction, Direction> = {
  down: "up",
  left: "right",
  right: "left",
  up: "down",
};

const snake = shallowRef<number[]>([210, 209, 208]);
const food = ref(-1);
const direction = ref<Direction>("right");
const nextDirection = ref<Direction>("right");
const gameStatus = ref<GameStatus>("ready");
const speed = ref<Speed>("classic");
const pointerStart = reactive({ x: 0, y: 0 });

const snakeSet = computed(() => new Set(snake.value));
const score = computed(() => snake.value.length - 3);
const selectedSpeed = computed(() => speedOptions.find((option) => option.value === speed.value)!);
const interval = computed(() => selectedSpeed.value.interval);
const statusText = computed(() => {
  if (gameStatus.value === "lost") return `Wall or tail hit. Final score: ${score.value}.`;
  if (gameStatus.value === "won") return `Board cleared. Final score: ${score.value}.`;
  if (gameStatus.value === "paused") return "Paused. Continue when ready.";
  if (gameStatus.value === "playing") return "Guide the snake to the food.";
  return "Choose a direction or press Start.";
});

const { pause, resume } = useIntervalFn(tick, interval, { immediate: false });

function placeFood(occupied = snake.value) {
  const occupiedSet = new Set(occupied);
  const openCells = cells.filter((index) => !occupiedSet.has(index));
  food.value = openCells.length ? openCells[Math.floor(Math.random() * openCells.length)]! : -1;
}

function nextHead(head: number, moveDirection: Direction) {
  const row = Math.floor(head / boardSize);
  const column = head % boardSize;
  const [rowChange, columnChange] = vectors[moveDirection];
  const nextRow = row + rowChange;
  const nextColumn = column + columnChange;
  if (nextRow < 0 || nextRow >= boardSize || nextColumn < 0 || nextColumn >= boardSize) return -1;
  return nextRow * boardSize + nextColumn;
}

function tick() {
  if (gameStatus.value !== "playing") return;
  direction.value = nextDirection.value;
  const head = nextHead(snake.value[0]!, direction.value);
  const eating = head === food.value;
  const collisionBody = eating ? snake.value : snake.value.slice(0, -1);

  if (head < 0 || collisionBody.includes(head)) {
    gameStatus.value = "lost";
    pause();
    return;
  }

  const nextSnake = [head, ...snake.value];
  if (!eating) nextSnake.pop();
  snake.value = nextSnake;

  if (eating) {
    if (nextSnake.length === cellCount) {
      food.value = -1;
      gameStatus.value = "won";
      pause();
    } else {
      placeFood(nextSnake);
    }
  }
}

function start() {
  if (gameStatus.value === "lost" || gameStatus.value === "won") reset();
  gameStatus.value = "playing";
  resume();
}

function togglePause() {
  if (gameStatus.value === "playing") {
    gameStatus.value = "paused";
    pause();
  } else {
    start();
  }
}

function chooseDirection(value: Direction) {
  if (opposites[direction.value] === value) return;
  nextDirection.value = value;
  if (gameStatus.value === "ready" || gameStatus.value === "paused") start();
}

function reset() {
  pause();
  snake.value = [210, 209, 208];
  direction.value = "right";
  nextDirection.value = "right";
  gameStatus.value = "ready";
  placeFood(snake.value);
}

function setSpeed(value: string | undefined) {
  if (!speedOptions.some((option) => option.value === value)) return;
  speed.value = value as Speed;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === " ") {
    const target = event.target as HTMLElement | null;
    if (!target?.matches("input, select, textarea, button")) {
      event.preventDefault();
      togglePause();
    }
    return;
  }

  const moveDirection = keyDirections[event.key] || keyDirections[event.key.toLowerCase()];
  if (!moveDirection) return;
  const target = event.target as HTMLElement | null;
  if (target?.matches("input, select, textarea")) return;
  event.preventDefault();
  chooseDirection(moveDirection);
}

function startSwipe(event: PointerEvent) {
  pointerStart.x = event.clientX;
  pointerStart.y = event.clientY;
}

function endSwipe(event: PointerEvent) {
  const x = event.clientX - pointerStart.x;
  const y = event.clientY - pointerStart.y;
  if (Math.max(Math.abs(x), Math.abs(y)) < 20) return;
  chooseDirection(Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "down" : "up");
}

if (import.meta.dev) {
  if (nextHead(0, "up") !== -1 || nextHead(0, "right") !== 1) {
    throw new Error("Snake move check failed");
  }
}

useEventListener("keydown", handleKeydown);
onMounted(reset);
</script>

<template>
  <ToolWorkbench description="Eat the food, grow longer, and avoid the walls and your own tail.">
    <div class="mx-auto grid max-w-2xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex items-center gap-2 text-sm leading-6"
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
            name="i-lucide-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="gameStatus === 'won'"
            name="i-lucide-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ statusText }}
        </p>
        <div class="shrink-0 text-right">
          <span class="text-muted block text-xs">Score</span>
          <strong class="text-highlighted font-mono text-lg tabular-nums">{{ score }}</strong>
        </div>
      </div>

      <div class="flex justify-center">
        <div
          class="bg-muted/30 grid aspect-square w-[min(86vw,30rem)] touch-none grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] border-2 transition-colors duration-200"
          :class="
            gameStatus === 'lost'
              ? 'border-error'
              : gameStatus === 'won'
                ? 'border-success'
                : 'border-inverted'
          "
          aria-label="Snake game board"
          role="img"
          @pointerdown="startSwipe"
          @pointerup="endSwipe"
        >
          <span
            v-for="index in cells"
            :key="index"
            class="border-default/20 min-h-0 min-w-0 border-r border-b transition-colors duration-100"
            :class="[
              index === food ? 'bg-warning' : '',
              snakeSet.has(index) ? 'bg-primary' : '',
              index === snake[0] ? 'bg-success' : '',
            ]"
          />
        </div>
      </div>

      <div class="grid justify-center gap-2 sm:hidden">
        <UButton
          aria-label="Move up"
          icon="i-lucide-arrow-up"
          color="neutral"
          variant="outline"
          class="mx-auto"
          @click="chooseDirection('up')"
        />
        <div class="flex gap-2">
          <UButton
            aria-label="Move left"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
            @click="chooseDirection('left')"
          />
          <UButton
            aria-label="Move down"
            icon="i-lucide-arrow-down"
            color="neutral"
            variant="outline"
            @click="chooseDirection('down')"
          />
          <UButton
            aria-label="Move right"
            icon="i-lucide-arrow-right"
            color="neutral"
            variant="outline"
            @click="chooseDirection('right')"
          />
        </div>
      </div>

      <div
        class="border-default/70 grid gap-4 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <UFormField
          label="Speed"
          :description="selectedSpeed.description"
          :ui="{ container: 'mt-2' }"
        >
          <USelect
            :model-value="speed"
            :items="speedOptions"
            value-key="value"
            label-key="label"
            size="lg"
            class="w-full sm:max-w-sm"
            :ui="{ base: 'rounded-none', content: 'rounded-none', item: 'before:rounded-none' }"
            @update:model-value="setSpeed"
          />
        </UFormField>

        <div class="flex flex-wrap gap-2 sm:justify-end">
          <UButton
            :label="gameStatus === 'playing' ? 'Pause' : 'Start'"
            color="neutral"
            variant="ghost"
            :icon="gameStatus === 'playing' ? 'i-lucide-pause' : 'i-lucide-play'"
            @click="togglePause"
          />
          <UButton
            label="New game"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="reset"
          />
        </div>
      </div>

      <p class="text-muted text-sm leading-6">
        Desktop: arrow keys or WASD. Touch: swipe the board or use the direction controls.
      </p>
    </div>
  </ToolWorkbench>
</template>
