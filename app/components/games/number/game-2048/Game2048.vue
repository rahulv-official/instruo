<script setup lang="ts">
type Direction = "down" | "left" | "right" | "up";

interface Tile {
  fresh: boolean;
  id: number;
  merged: boolean;
  position: number;
  value: number;
}

const boardSize = 4;
const cellCount = boardSize * boardSize;
const directionKeys: Record<string, Direction> = {
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  a: "left",
  d: "right",
  s: "down",
  w: "up",
};

const boardElement = useTemplateRef<HTMLElement>("board");
const tiles = shallowRef<Tile[]>([]);
const score = ref(0);
const moving = ref(false);
const pointerStart = reactive({ x: 0, y: 0 });
const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
let nextTileId = 0;

const board = computed(() => {
  const values = Array<number>(cellCount).fill(0);
  for (const tile of tiles.value) values[tile.position] = tile.value;
  return values;
});
const highestTile = computed(() => Math.max(...board.value));
const gameOver = computed(() => !canMove(board.value));
const won = computed(() => highestTile.value >= 2048);
const lost = computed(() => gameOver.value && !won.value);
const status = computed(() => {
  if (lost.value) return `No moves left. Final score: ${score.value}.`;
  if (gameOver.value) return `2048 reached. Final score: ${score.value}.`;
  if (won.value) return "2048 reached. Keep combining tiles or start again.";
  return "Use arrow keys, WASD, or swipe the board.";
});

function lineIndexes(direction: Direction, line: number) {
  const indexes = Array.from({ length: boardSize }, (_, offset) => {
    if (direction === "left" || direction === "right") return line * boardSize + offset;
    return offset * boardSize + line;
  });
  return direction === "right" || direction === "down" ? indexes.reverse() : indexes;
}

function moveTiles(state: Tile[], direction: Direction) {
  const next: Tile[] = [];
  let gained = 0;

  for (let line = 0; line < boardSize; line += 1) {
    const indexes = lineIndexes(direction, line);
    const lineTiles = indexes
      .map((position) => state.find((tile) => tile.position === position))
      .filter((tile): tile is Tile => Boolean(tile));
    let targetOffset = 0;

    for (let index = 0; index < lineTiles.length; index += 1) {
      const tile = lineTiles[index]!;
      const targetPosition = indexes[targetOffset++]!;

      if (tile.value === lineTiles[index + 1]?.value) {
        const movingTile = lineTiles[index + 1]!;
        const value = tile.value * 2;
        next.push({ ...movingTile, fresh: false, merged: true, position: targetPosition, value });
        gained += value;
        index += 1;
      } else {
        next.push({ ...tile, fresh: false, merged: false, position: targetPosition });
      }
    }
  }

  return { gained, tiles: next };
}

function canMove(state: number[]) {
  if (state.some((value) => value === 0)) return true;

  return state.some((value, index) => {
    const row = Math.floor(index / boardSize);
    const column = index % boardSize;
    return (
      (column < boardSize - 1 && state[index + 1] === value) ||
      (row < boardSize - 1 && state[index + boardSize] === value)
    );
  });
}

function addRandomTile(state: Tile[]) {
  const occupied = new Set(state.map((tile) => tile.position));
  const empty = Array.from({ length: cellCount }, (_, index) => index).filter(
    (index) => !occupied.has(index),
  );
  if (!empty.length) return state;
  return [
    ...state,
    {
      fresh: true,
      id: ++nextTileId,
      merged: false,
      position: empty[Math.floor(Math.random() * empty.length)]!,
      value: Math.random() < 0.9 ? 2 : 4,
    },
  ];
}

function tileRects() {
  const rects = new Map<number, DOMRect>();
  boardElement.value?.querySelectorAll<HTMLElement>("[data-tile-id]").forEach((element) => {
    rects.set(Number(element.dataset.tileId), element.getBoundingClientRect());
  });
  return rects;
}

async function animateTiles(previousRects: Map<number, DOMRect>) {
  if (reduceMotion.value) return;
  const animations: Animation[] = [];

  boardElement.value?.querySelectorAll<HTMLElement>("[data-tile-id]").forEach((element) => {
    const tile = tiles.value.find((item) => item.id === Number(element.dataset.tileId));
    if (!tile) return;
    const previous = previousRects.get(tile.id);

    if (tile.fresh || !previous) {
      animations.push(
        element.animate(
          [
            { opacity: 0.4, transform: "scale(0.65)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 160, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        ),
      );
      return;
    }

    const current = element.getBoundingClientRect();
    const x = previous.left - current.left;
    const y = previous.top - current.top;
    const keyframes: Keyframe[] = tile.merged
      ? [
          { transform: `translate(${x}px, ${y}px) scale(1)` },
          { offset: 0.7, transform: "translate(0, 0) scale(1)" },
          { offset: 0.86, transform: "translate(0, 0) scale(1.08)" },
          { transform: "translate(0, 0) scale(1)" },
        ]
      : [{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }];
    animations.push(
      element.animate(keyframes, {
        duration: tile.merged ? 220 : 170,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
      }),
    );
  });

  await Promise.allSettled(animations.map((animation) => animation.finished));
}

async function move(direction: Direction) {
  if (gameOver.value || moving.value) return;
  const previousRects = tileRects();
  const result = moveTiles(tiles.value, direction);
  const changed = result.tiles.some((tile) => {
    const previous = tiles.value.find((item) => item.id === tile.id);
    return !previous || previous.position !== tile.position || previous.value !== tile.value;
  });
  if (!changed) return;

  moving.value = true;
  score.value += result.gained;
  tiles.value = addRandomTile(result.tiles);
  await nextTick();
  await animateTiles(previousRects);
  tiles.value = tiles.value.map((tile) => ({ ...tile, fresh: false, merged: false }));
  moving.value = false;
}

function reset() {
  moving.value = false;
  score.value = 0;
  tiles.value = addRandomTile(addRandomTile([]));
}

function handleKeydown(event: KeyboardEvent) {
  const direction = directionKeys[event.key] || directionKeys[event.key.toLowerCase()];
  if (!direction) return;
  const target = event.target as HTMLElement | null;
  if (target?.matches("input, select, textarea")) return;
  event.preventDefault();
  move(direction);
}

function startSwipe(event: PointerEvent) {
  pointerStart.x = event.clientX;
  pointerStart.y = event.clientY;
}

function endSwipe(event: PointerEvent) {
  const x = event.clientX - pointerStart.x;
  const y = event.clientY - pointerStart.y;
  if (Math.max(Math.abs(x), Math.abs(y)) < 24) return;
  move(Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "down" : "up");
}

function tileClass(value: number) {
  if (value <= 4) return "bg-elevated text-highlighted";
  if (value <= 16) return "bg-primary/10 text-highlighted";
  if (value <= 64) return "bg-primary/20 text-primary";
  if (value <= 256) return "bg-warning/20 text-warning";
  if (value <= 1024) return "bg-warning/35 text-highlighted";
  return "bg-success/25 text-success";
}

function tileStyle(tile: Tile) {
  return {
    gridColumn: (tile.position % boardSize) + 1,
    gridRow: Math.floor(tile.position / boardSize) + 1,
  };
}

if (import.meta.dev) {
  const check = moveTiles(
    [
      { fresh: false, id: 1, merged: false, position: 0, value: 2 },
      { fresh: false, id: 2, merged: false, position: 1, value: 2 },
      { fresh: false, id: 3, merged: false, position: 2, value: 4 },
      { fresh: false, id: 4, merged: false, position: 3, value: 4 },
    ],
    "left",
  );
  if (
    check.gained !== 12 ||
    check.tiles.map((tile) => `${tile.position}:${tile.value}`).join(",") !== "0:4,1:8"
  ) {
    throw new Error("2048 merge check failed");
  }
}

useEventListener("keydown", handleKeydown);
onMounted(reset);
</script>

<template>
  <ToolWorkbench
    description="Join matching tiles to reach 2048. The board runs entirely in this browser."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="lost ? 'text-error' : won ? 'text-success' : 'text-toned'"
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="lost"
            name="i-lucide-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="won"
            name="i-lucide-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>
        <div class="shrink-0 text-right">
          <span class="text-muted block text-xs">Score</span>
          <strong class="text-highlighted font-mono text-lg tabular-nums">{{ score }}</strong>
        </div>
      </div>

      <div class="flex justify-center">
        <div
          ref="board"
          class="bg-muted/50 relative grid aspect-square w-[min(86vw,30rem)] touch-none grid-cols-4 grid-rows-4 gap-2 border-2 p-2 transition-colors duration-200 sm:gap-3 sm:p-3"
          :class="lost ? 'border-error' : won ? 'border-success' : 'border-inverted'"
          aria-label="2048 game board"
          @pointerdown="startSwipe"
          @pointerup="endSwipe"
        >
          <span
            v-for="index in cellCount"
            :key="index"
            class="border-default/70 bg-default min-h-0 min-w-0 border"
            aria-hidden="true"
          />

          <div
            class="pointer-events-none absolute inset-2 grid grid-cols-4 grid-rows-4 gap-2 sm:inset-3 sm:gap-3"
          >
            <div
              v-for="tile in tiles"
              :key="tile.id"
              :data-tile-id="tile.id"
              :style="tileStyle(tile)"
              class="border-default/70 flex min-h-0 min-w-0 items-center justify-center border font-mono text-[clamp(1rem,6vw,2.25rem)] leading-none font-bold tabular-nums transition-colors duration-150"
              :class="tileClass(tile.value)"
              :aria-label="`Tile ${tile.value}`"
            >
              {{ tile.value }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">
          Combine equal tiles. Each merge adds its value to your score.
        </p>
        <UButton
          label="New game"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
