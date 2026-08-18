<script setup lang="ts">
const size = 5;
const cellCount = size * size;
const board = shallowRef<boolean[]>([]);
const moves = ref(0);

const isWon = computed(() => board.value.length > 0 && board.value.every((cell) => !cell));
const statusText = computed(() =>
  isWon.value ? `Board cleared in ${moves.value} moves.` : "Turn every light off.",
);
const boardStyle = computed(() => ({ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }));

function toggle(index: number) {
  if (isWon.value) return;

  const row = Math.floor(index / size);
  const column = index % size;
  const targets = [
    [row, column],
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1],
  ];
  const nextBoard = [...board.value];

  for (const [targetRow, targetColumn] of targets) {
    if (targetRow === undefined || targetColumn === undefined) continue;
    if (targetRow < 0 || targetRow >= size || targetColumn < 0 || targetColumn >= size) continue;
    const targetIndex = targetRow * size + targetColumn;
    nextBoard[targetIndex] = !nextBoard[targetIndex];
  }

  board.value = nextBoard;
  moves.value += 1;
}

function reset() {
  const nextBoard = Array<boolean>(cellCount).fill(false);
  const scrambleMoves = 12 + Math.floor(Math.random() * 9);
  board.value = nextBoard;
  moves.value = 0;

  for (let index = 0; index < scrambleMoves; index += 1) {
    const cell = Math.floor(Math.random() * cellCount);
    const row = Math.floor(cell / size);
    const column = cell % size;
    const targets = [
      [row, column],
      [row - 1, column],
      [row + 1, column],
      [row, column - 1],
      [row, column + 1],
    ];
    for (const [targetRow, targetColumn] of targets) {
      if (targetRow === undefined || targetColumn === undefined) continue;
      if (targetRow < 0 || targetRow >= size || targetColumn < 0 || targetColumn >= size) continue;
      const targetIndex = targetRow * size + targetColumn;
      nextBoard[targetIndex] = !nextBoard[targetIndex];
    }
  }
  if (nextBoard.every((cell) => !cell)) {
    nextBoard[0] = true;
    nextBoard[1] = true;
    nextBoard[size] = true;
  }
  board.value = nextBoard;
}

onMounted(reset);
</script>

<template>
  <ToolWorkbench
    description="Switching a light also switches its direct neighbors. Clear every light to win."
  >
    <div class="mx-auto grid w-full max-w-xl min-w-0 gap-6">
      <div
        class="border-default/70 flex min-w-0 flex-wrap items-center justify-between gap-3 border-b pb-4"
      >
        <p
          class="text-toned flex min-w-0 flex-1 items-center gap-2 text-sm leading-6"
          :class="isWon ? 'text-success' : ''"
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="isWon"
            name="i-tabler-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ statusText }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm tabular-nums">{{ moves }} moves</span>
      </div>

      <div class="flex min-w-0 justify-center px-0.5 sm:px-2">
        <div
          class="bg-muted/20 border-inverted grid aspect-square w-full max-w-[28rem] min-w-0 gap-1 border-2 p-1 sm:gap-2 sm:p-2"
          :style="boardStyle"
          aria-label="Lights Out board"
        >
          <button
            v-for="(isOn, index) in board"
            :key="index"
            type="button"
            class="lights-out-tile focus-visible:ring-primary grid min-h-0 min-w-0 place-items-center border transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.94]"
            :class="
              isOn
                ? 'border-warning bg-warning/80 text-highlighted shadow-[0_0_18px_color-mix(in_srgb,var(--ui-color-warning-500)_35%,transparent)]'
                : 'border-default/70 bg-default text-muted hover:bg-elevated/60'
            "
            :data-on="isOn"
            :aria-label="`Light ${index + 1}, ${isOn ? 'on' : 'off'}`"
            :aria-pressed="isOn"
            @click="toggle(index)"
          >
            <UIcon
              :name="isOn ? 'i-tabler-bulb' : 'i-tabler-bulb-off'"
              class="size-5 sm:size-6"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted min-w-0 flex-1 text-sm leading-6">
          Every puzzle starts from legal moves, so every board is solvable.
        </p>
        <UButton
          label="New puzzle"
          color="neutral"
          variant="outline"
          icon="i-tabler-refresh"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.lights-out-tile[data-on="true"] {
  animation: light-breathe 1.5s ease-in-out infinite alternate;
}

@keyframes light-breathe {
  from {
    filter: brightness(0.96);
  }
  to {
    filter: brightness(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lights-out-tile[data-on="true"] {
    animation: none;
  }
}
</style>
