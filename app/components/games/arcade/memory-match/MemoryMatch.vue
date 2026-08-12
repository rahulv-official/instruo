<script setup lang="ts">
type GameStatus = "playing" | "ready" | "won";

interface Card {
  flipped: boolean;
  id: string;
  matched: boolean;
  symbol: string;
}

const symbols = ["◆", "●", "▲", "■", "✦", "✚", "☾", "✿"];
const cardIndexes = Array.from({ length: symbols.length * 2 }, (_, index) => index);

const cards = shallowRef<Card[]>(createDeck());
const gameStatus = ref<GameStatus>("ready");
const moves = ref(0);
const elapsedSeconds = ref(0);
const locked = ref(false);

const matchedPairs = computed(() => cards.value.filter((card) => card.matched).length / 2);
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
const statusText = computed(() => {
  if (gameStatus.value === "won")
    return `All pairs found in ${moves.value} moves and ${formattedTime.value}.`;
  if (gameStatus.value === "playing") return "Turn over two cards and find a matching pair.";
  return "Turn over two cards to begin.";
});

const { pause: pauseTimer, resume: startTimer } = useIntervalFn(
  () => {
    if (gameStatus.value === "playing") elapsedSeconds.value += 1;
  },
  1_000,
  { immediate: false },
);
const { start: hideMismatch, stop: cancelMismatch } = useTimeoutFn(
  () => {
    cards.value = cards.value.map((card) => (card.matched ? card : { ...card, flipped: false }));
    locked.value = false;
  },
  650,
  { immediate: false },
);

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}

function createDeck() {
  return shuffle(
    symbols.flatMap((symbol) =>
      [0, 1].map((copy) => ({
        flipped: false,
        id: `${symbol}-${copy}`,
        matched: false,
        symbol,
      })),
    ),
  );
}

function reveal(index: number) {
  const selected = cards.value[index];
  if (
    !selected ||
    selected.flipped ||
    selected.matched ||
    locked.value ||
    gameStatus.value === "won"
  )
    return;

  if (gameStatus.value === "ready") {
    gameStatus.value = "playing";
    startTimer();
  }

  let nextCards = cards.value.map((card, cardIndex) =>
    cardIndex === index ? { ...card, flipped: true } : card,
  );
  const open = nextCards.filter((card) => card.flipped && !card.matched);

  if (open.length < 2) {
    cards.value = nextCards;
    return;
  }

  moves.value += 1;
  if (open[0]!.symbol === open[1]!.symbol) {
    const matchedIds = new Set(open.map((card) => card.id));
    nextCards = nextCards.map((card) =>
      matchedIds.has(card.id) ? { ...card, matched: true } : card,
    );
    cards.value = nextCards;
    if (nextCards.every((card) => card.matched)) {
      gameStatus.value = "won";
      pauseTimer();
    }
    return;
  }

  cards.value = nextCards;
  locked.value = true;
  hideMismatch();
}

function reset() {
  pauseTimer();
  cancelMismatch();
  cards.value = createDeck();
  gameStatus.value = "ready";
  moves.value = 0;
  elapsedSeconds.value = 0;
  locked.value = false;
}

if (import.meta.dev) {
  const counts = createDeck().reduce<Map<string, number>>((result, card) => {
    result.set(card.symbol, (result.get(card.symbol) ?? 0) + 1);
    return result;
  }, new Map());
  if (counts.size !== symbols.length || [...counts.values()].some((count) => count !== 2)) {
    throw new Error("Memory Match deck check failed");
  }
}

onMounted(reset);
</script>

<template>
  <ToolWorkbench
    description="Find every matching pair. The deck is shuffled locally for each new game."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
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
          {{ statusText }}
        </p>
        <div class="flex shrink-0 gap-5 font-mono text-sm tabular-nums">
          <span><strong class="text-highlighted">{{ matchedPairs }}/{{ symbols.length }}</strong> pairs</span>
          <span><strong class="text-highlighted">{{ formattedTime }}</strong> time</span>
        </div>
      </div>

      <div class="flex justify-center">
        <div
          class="bg-muted/30 grid w-[min(88vw,30rem)] grid-cols-4 gap-2 border-2 p-2 sm:gap-3 sm:p-3"
          :class="gameStatus === 'won' ? 'border-success' : 'border-inverted'"
          aria-label="Memory Match board"
        >
          <button
            v-for="index in cardIndexes"
            :key="cards[index]?.id"
            type="button"
            class="focus-visible:ring-primary border-default/70 bg-default hover:bg-elevated/60 aspect-square min-h-0 min-w-0 border transition-[background-color,border-color,transform] duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.96]"
            :class="
              cards[index]?.matched
                ? 'border-success bg-success/15 text-success'
                : cards[index]?.flipped
                  ? 'border-primary bg-primary/10 text-highlighted'
                  : 'text-transparent'
            "
            :aria-label="
              cards[index]?.matched || cards[index]?.flipped
                ? `Card ${index + 1}, ${cards[index]?.symbol}`
                : `Card ${index + 1}, hidden`
            "
            :aria-pressed="Boolean(cards[index]?.flipped)"
            @click="reveal(index)"
          >
            <span class="font-mono text-[clamp(1.5rem,7vw,2.5rem)] leading-none">{{
              cards[index]?.symbol
            }}</span>
          </button>
        </div>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">
          A mismatched pair turns back after a short pause.
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
