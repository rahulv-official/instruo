<script setup lang="ts">
type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Status = "ready" | "playing" | "over";
type DealMode = "classic" | "relaxed";
type Location =
  | { kind: "tableau"; column: number; index: number }
  | { kind: "waste" }
  | { kind: "foundation"; suit: Suit };

interface Card {
  id: string;
  suit: Suit;
  rank: string;
  value: number;
  color: "red" | "black";
  faceUp: boolean;
}

interface Snapshot {
  stock: Card[];
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  tableau: Card[][];
  moves: number;
  score: number;
}

const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const symbols: Record<Suit, string> = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const names: Record<Suit, string> = {
  spades: "Spades",
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
};
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const status = ref<Status>("ready");
const stock = ref<Card[]>([]);
const waste = ref<Card[]>([]);
const foundations = ref<Record<Suit, Card[]>>(emptyFoundations());
const tableau = ref<Card[][]>([]);
const selected = ref<Location | null>(null);
const history = ref<Snapshot[]>([]);
const moves = ref(0);
const score = ref(0);
const elapsed = ref(0);
const startedAt = ref(0);
const notice = ref("Tap a card, then choose its destination.");
const bestScore = ref(0);
const bestTime = ref(0);
const mode = ref<DealMode>("classic");
const modeItems = [
  { label: "Classic · draw 3", value: "classic" as DealMode },
  { label: "Relaxed · draw 1", value: "relaxed" as DealMode },
];

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    if (status.value === "playing")
      elapsed.value = Math.floor((Date.now() - startedAt.value) / 1000);
  },
  1000,
  { immediate: false },
);

const foundationCount = computed(() =>
  suits.reduce((total, suit) => total + foundations.value[suit].length, 0),
);
const drawCount = computed(() => (mode.value === "relaxed" ? 1 : 3));
const canUndo = computed(() => status.value === "playing" && history.value.length > 0);
const timeLabel = computed(() => formatTime(elapsed.value));
const dialogCopy = computed(() =>
  status.value === "over"
    ? `Completed in ${timeLabel.value} with ${moves.value} moves.`
    : notice.value,
);

function emptyFoundations(): Record<Suit, Card[]> {
  return { spades: [], hearts: [], diamonds: [], clubs: [] };
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function changeMode(value: DealMode) {
  mode.value = value;
}

function copyCards(cards: Card[]) {
  return cards.map((card) => ({ ...card }));
}

function copyFoundations(source: Record<Suit, Card[]>) {
  return suits.reduce((result, suit) => {
    result[suit] = copyCards(source[suit]);
    return result;
  }, emptyFoundations());
}

function shuffled(cards: Card[]) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

function createDeck(): Card[] {
  return shuffled(
    suits.flatMap((suit) =>
      ranks.map((rank, index) => ({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: index + 1,
        color: (suit === "hearts" || suit === "diamonds" ? "red" : "black") as Card["color"],
        faceUp: false,
      })),
    ),
  );
}

function deal() {
  const deck = createDeck();
  const nextTableau = Array.from({ length: 7 }, () => [] as Card[]);
  for (let column = 0; column < 7; column += 1) {
    for (let row = 0; row <= column; row += 1) {
      const card = deck.pop();
      if (!card) continue;
      card.faceUp = row === column;
      nextTableau[column]!.push(card);
    }
  }
  stock.value = deck;
  waste.value = [];
  foundations.value = emptyFoundations();
  tableau.value = nextTableau;
  history.value = [];
  selected.value = null;
  moves.value = 0;
  score.value = 0;
  elapsed.value = 0;
  notice.value = "Tap a card, then choose its destination.";
}

function start() {
  if (status.value === "playing") return;
  status.value = "playing";
  startedAt.value = Date.now() - elapsed.value * 1000;
  resumeTimer();
  notice.value = "Build each suit from Ace to King.";
}

function newDeal() {
  deal();
  start();
}

function makeSnapshot(): Snapshot {
  return {
    stock: copyCards(stock.value),
    waste: copyCards(waste.value),
    foundations: copyFoundations(foundations.value),
    tableau: tableau.value.map(copyCards),
    moves: moves.value,
    score: score.value,
  };
}

function saveSnapshot() {
  history.value = [...history.value.slice(-79), makeSnapshot()];
}

function undo() {
  const previous = history.value.at(-1);
  if (!previous) return;
  history.value = history.value.slice(0, -1);
  stock.value = copyCards(previous.stock);
  waste.value = copyCards(previous.waste);
  foundations.value = copyFoundations(previous.foundations);
  tableau.value = previous.tableau.map(copyCards);
  moves.value = previous.moves;
  score.value = previous.score;
  selected.value = null;
  notice.value = "Move undone.";
}

function cardsAt(location: Location) {
  if (location.kind === "waste") return waste.value.at(-1) ? [waste.value.at(-1)!] : [];
  if (location.kind === "foundation")
    return foundations.value[location.suit].at(-1)
      ? [foundations.value[location.suit].at(-1)!]
      : [];
  return tableau.value[location.column]?.slice(location.index) ?? [];
}

function cardAt(location: Location) {
  return cardsAt(location)[0];
}

function sameLocation(left: Location | null, right: Location) {
  if (!left || left.kind !== right.kind) return false;
  if (left.kind === "tableau" && right.kind === "tableau")
    return left.column === right.column && left.index === right.index;
  if (left.kind === "foundation" && right.kind === "foundation") return left.suit === right.suit;
  return true;
}

function removeCards(location: Location) {
  if (location.kind === "waste") {
    waste.value = waste.value.slice(0, -1);
    return;
  }
  if (location.kind === "foundation") {
    foundations.value[location.suit] = foundations.value[location.suit].slice(0, -1);
    return;
  }
  const pile = [...(tableau.value[location.column] ?? [])];
  pile.splice(location.index);
  const hidden = pile.at(-1);
  if (hidden && !hidden.faceUp) pile[pile.length - 1] = { ...hidden, faceUp: true };
  tableau.value[location.column] = pile;
}

function canTableau(cards: Card[], column: number) {
  const first = cards[0];
  if (!first?.faceUp) return false;
  const destination = tableau.value[column]?.at(-1);
  return destination
    ? destination.faceUp &&
        destination.value === first.value + 1 &&
        destination.color !== first.color
    : first.value === 13;
}

function canFoundation(card: Card | undefined, suit: Suit) {
  if (!card?.faceUp || card.suit !== suit) return false;
  const destination = foundations.value[suit].at(-1);
  return destination ? card.value === destination.value + 1 : card.value === 1;
}

function moveTo(destination: Location) {
  const source = selected.value;
  if (!source || sameLocation(source, destination)) return false;
  if (destination.kind === "waste") return false;
  const cards = cardsAt(source);
  if (!cards.length) return false;
  if (destination.kind === "tableau" && !canTableau(cards, destination.column)) return false;
  if (
    destination.kind === "foundation" &&
    (cards.length !== 1 || !canFoundation(cards[0], destination.suit))
  )
    return false;
  saveSnapshot();
  removeCards(source);
  if (destination.kind === "tableau") {
    tableau.value[destination.column] = [...(tableau.value[destination.column] ?? []), ...cards];
    score.value += 5;
  } else {
    foundations.value[destination.suit] = [...foundations.value[destination.suit], cards[0]!];
    score.value += 10;
  }
  moves.value += 1;
  selected.value = null;
  notice.value = destination.kind === "foundation" ? "Foundation built." : "Nice move.";
  if (foundationCount.value === 52) finish();
  return true;
}

function choose(location: Location) {
  const card = cardAt(location);
  if (!card?.faceUp) return;
  if (selected.value) {
    if (moveTo(location)) return;
    if (!sameLocation(selected.value, location)) {
      notice.value = "That stack cannot move there.";
      return;
    }
  }
  selected.value = sameLocation(selected.value, location) ? null : location;
  notice.value = selected.value ? "Choose a tableau column or foundation." : "Selection cleared.";
}

function chooseTableau(column: number) {
  if (
    selected.value &&
    moveTo({ kind: "tableau", column, index: tableau.value[column]?.length ?? 0 })
  )
    return;
  if (selected.value) notice.value = "That stack cannot move there.";
  else notice.value = "Select a face-up card first.";
}

function chooseFoundation(suit: Suit) {
  if (selected.value && moveTo({ kind: "foundation", suit })) return;
  if (selected.value)
    notice.value = "Only the next card of the same suit can enter this foundation.";
  else notice.value = "Select a face-up card first.";
}

function draw() {
  if (status.value !== "playing") return;
  saveSnapshot();
  selected.value = null;
  if (stock.value.length) {
    const next = [...stock.value];
    const drawn = next
      .splice(Math.max(0, next.length - drawCount.value))
      .map((card) => ({ ...card, faceUp: true }));
    stock.value = next;
    waste.value = [...waste.value, ...drawn];
    notice.value = "Drawn from stock.";
  } else {
    stock.value = waste.value
      .slice()
      .reverse()
      .map((card) => ({ ...card, faceUp: false }));
    waste.value = [];
    notice.value = "Waste recycled into stock.";
  }
  moves.value += 1;
}

function finish() {
  status.value = "over";
  pauseTimer();
  selected.value = null;
  notice.value = "Table cleared.";
  try {
    const previous =
      Number.parseInt(localStorage.getItem("instruo:solitaire-best-score") ?? "0", 10) || 0;
    bestScore.value = Math.max(previous, score.value);
    localStorage.setItem("instruo:solitaire-best-score", String(bestScore.value));
    if (!bestTime.value || elapsed.value < bestTime.value) {
      bestTime.value = elapsed.value;
      localStorage.setItem("instruo:solitaire-best-time", String(bestTime.value));
    }
  } catch {
    bestScore.value = score.value;
  }
}

function autoFoundation(location: Location) {
  const card = cardAt(location);
  if (!card?.faceUp || location.kind === "foundation") return;
  selected.value = location;
  if (!moveTo({ kind: "foundation", suit: card.suit }))
    notice.value = "That card is not ready for its foundation yet.";
}

function hint() {
  if (status.value !== "playing") return;
  for (let column = 0; column < tableau.value.length; column += 1) {
    const pile = tableau.value[column] ?? [];
    for (let index = 0; index < pile.length; index += 1) {
      const card = pile[index];
      if (!card?.faceUp) continue;
      if (index === pile.length - 1 && canFoundation(card, card.suit)) {
        notice.value = `Try moving ${cardLabel(card)} to its foundation.`;
        selected.value = { kind: "tableau", column, index };
        return;
      }
      const cards = pile.slice(index);
      for (let target = 0; target < tableau.value.length; target += 1) {
        if (target !== column && canTableau(cards, target)) {
          notice.value = `Try moving ${cardLabel(card)} to tableau column ${target + 1}.`;
          selected.value = { kind: "tableau", column, index };
          return;
        }
      }
    }
  }
  const wasteCard = waste.value.at(-1);
  if (wasteCard && canFoundation(wasteCard, wasteCard.suit)) {
    notice.value = `Try moving ${cardLabel(wasteCard)} to its foundation.`;
    selected.value = { kind: "waste" };
    return;
  }
  notice.value = "No obvious move. Draw a card or reveal another face-down card.";
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.matches("input, textarea, [contenteditable='true']")) return;
  if (event.key === "Escape") selected.value = null;
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (status.value === "ready") start();
    else if (status.value === "playing") draw();
    else newDeal();
  }
  if (event.key.toLowerCase() === "z" && canUndo.value) undo();
  if (event.key.toLowerCase() === "n") newDeal();
  if (event.key.toLowerCase() === "h") hint();
}

function cardLabel(card: Card) {
  return `${card.rank} of ${names[card.suit]}`;
}

function cardClass(card: Card, location: Location) {
  return [
    "relative grid aspect-[5/7] min-h-12 w-full min-w-12 select-none place-items-center overflow-hidden rounded-md border text-center shadow-sm transition-[transform,box-shadow,filter] duration-150",
    card.faceUp
      ? "border-[#d8c9ae] bg-[#fffaf0] text-[#24363a] hover:-translate-y-0.5 hover:shadow-md"
      : "border-[#74c8ad]/60 bg-[#16544b] text-[#a7e2c6] hover:brightness-110",
    sameLocation(selected.value, location)
      ? "z-10 -translate-y-1 ring-2 ring-[#f4bd68] ring-offset-2 ring-offset-[#0c302c]"
      : "",
  ];
}

function dragStart(event: DragEvent, location: Location) {
  const card = cardAt(location);
  if (!card?.faceUp) return;
  selected.value = location;
  event.dataTransfer?.setData("text/plain", card.id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

useEventListener("keydown", handleKeydown);
onMounted(() => {
  deal();
  try {
    bestScore.value =
      Number.parseInt(localStorage.getItem("instruo:solitaire-best-score") ?? "0", 10) || 0;
    bestTime.value =
      Number.parseInt(localStorage.getItem("instruo:solitaire-best-time") ?? "0", 10) || 0;
  } catch {
    bestScore.value = 0;
    bestTime.value = 0;
  }
});
onBeforeUnmount(() => pauseTimer());
</script>

<template>
  <ToolWorkbench
    description="Build every suit from Ace to King in a tactile local game of Klondike. No account, no betting."
  >
    <div class="mx-auto grid max-w-4xl gap-5">
      <header
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-b pb-4"
      >
        <div>
          <p class="text-highlighted text-sm font-semibold">Solitaire</p>
          <p class="text-muted mt-1 font-mono text-xs">Klondike · local deck</p>
        </div>
        <div class="text-muted flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
          <span
            ><strong class="text-highlighted">{{ foundationCount }}/52</strong> cards</span
          >
          <span
            ><strong class="text-highlighted">{{ timeLabel }}</strong></span
          >
          <span
            ><strong class="text-highlighted">{{ moves }}</strong> moves</span
          >
          <span
            v-if="bestScore"
            class="text-muted/80"
            >best {{ bestScore }}</span
          >
        </div>
      </header>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p
          class="text-toned min-h-5 text-sm"
          role="status"
          aria-live="polite"
        >
          {{ dialogCopy }}
        </p>
        <div class="flex flex-wrap items-end gap-2">
          <UFormField label="Deal style">
            <USelect
              :model-value="mode"
              :items="modeItems"
              value-key="value"
              label-key="label"
              size="sm"
              class="w-44"
              :disabled="status === 'playing'"
              @update:model-value="changeMode"
            />
          </UFormField>
          <UButton
            label="Hint"
            icon="i-tabler-bulb"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="status !== 'playing'"
            @click="hint"
          />
          <UButton
            label="Undo"
            icon="i-tabler-arrow-back-up"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="!canUndo"
            @click="undo"
          />
          <UButton
            label="New deal"
            icon="i-tabler-refresh"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="newDeal"
          />
        </div>
      </div>

      <section
        class="relative overflow-x-auto overflow-y-hidden rounded-xl border border-[#74c8ad]/25 bg-[#0c302c] p-3 shadow-lg sm:p-5"
        aria-label="Solitaire table"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgb(104_201_164/0.16),transparent_58%)]"
        />
        <div class="relative mx-auto max-w-3xl min-w-100">
          <div class="mb-4 grid grid-cols-7 gap-2 sm:gap-3">
            <button
              type="button"
              class="grid aspect-5/7 min-h-12 min-w-12 place-items-center rounded-md border border-[#74c8ad]/65 bg-[#16544b] font-mono text-xs text-[#c6f0d8] shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#f4bd68] focus-visible:outline-none"
              :aria-label="
                stock.length
                  ? `Draw from stock, ${stock.length} cards remaining`
                  : 'Recycle waste into stock'
              "
              @click="status === 'ready' ? start() : draw()"
            >
              <span class="grid place-items-center gap-1"
                ><span class="text-2xl">✦</span><span>{{ stock.length || "↻" }}</span></span
              >
            </button>
            <button
              v-if="waste.at(-1)"
              type="button"
              :class="cardClass(waste.at(-1)!, { kind: 'waste' })"
              :aria-label="`Waste card: ${cardLabel(waste.at(-1)!)}`"
              draggable="true"
              @click="choose({ kind: 'waste' })"
              @dblclick="autoFoundation({ kind: 'waste' })"
              @dragstart="dragStart($event, { kind: 'waste' })"
              @dragend="selected = null"
            >
              <span class="grid place-items-center leading-none"
                ><span class="text-lg font-bold sm:text-xl">{{ waste.at(-1)!.rank }}</span
                ><span
                  class="text-2xl sm:text-3xl"
                  :class="waste.at(-1)!.color === 'red' ? 'text-[#c44f52]' : 'text-[#24363a]'"
                  >{{ symbols[waste.at(-1)!.suit] }}</span
                ></span
              >
            </button>
            <div
              v-else
              class="grid aspect-5/7 min-h-12 min-w-12 place-items-center rounded-md border border-dashed border-[#74c8ad]/30 text-xs text-[#a7d8c1]"
              aria-label="Empty waste"
            >
              —
            </div>
            <div />
            <button
              v-for="suit in suits"
              :key="suit"
              type="button"
              class="grid aspect-5/7 min-h-12 min-w-12 place-items-center rounded-md border border-dashed border-[#74c8ad]/35 text-2xl text-[#a7d8c1] transition hover:border-[#f4bd68]/70 focus-visible:ring-2 focus-visible:ring-[#f4bd68] focus-visible:outline-none"
              :class="
                foundations[suit].at(-1)
                  ? cardClass(foundations[suit].at(-1)!, { kind: 'foundation', suit })
                  : ''
              "
              :aria-label="`${names[suit]} foundation`"
              @click="chooseFoundation(suit)"
              @dragover.prevent
              @drop="moveTo({ kind: 'foundation', suit })"
            >
              <template v-if="foundations[suit].at(-1)"
                ><span class="grid place-items-center leading-none"
                  ><span class="text-lg font-bold sm:text-xl">{{
                    foundations[suit].at(-1)!.rank
                  }}</span
                  ><span
                    class="text-2xl sm:text-3xl"
                    :class="
                      foundations[suit].at(-1)!.color === 'red'
                        ? 'text-[#c44f52]'
                        : 'text-[#24363a]'
                    "
                    >{{ symbols[suit] }}</span
                  ></span
                ></template
              >
              <template v-else>{{ symbols[suit] }}</template>
            </button>
          </div>

          <div class="grid grid-cols-7 items-start gap-2 sm:gap-3">
            <div
              v-for="(column, columnIndex) in tableau"
              :key="columnIndex"
              class="min-h-44 rounded-md border border-dashed border-[#74c8ad]/25 p-0.5 transition-colors hover:border-[#f4bd68]/50 sm:min-h-56"
              @dragover.prevent
              @drop="chooseTableau(columnIndex)"
            >
              <div
                v-if="!column.length"
                class="grid min-h-44 place-items-center text-xs text-[#a7d8c1] sm:min-h-56"
                aria-hidden="true"
              >
                K
              </div>
              <div
                v-else
                class="grid auto-rows-max -space-y-8 sm:-space-y-10"
              >
                <button
                  v-for="(card, cardIndex) in column"
                  :key="card.id"
                  type="button"
                  :class="
                    cardClass(card, { kind: 'tableau', column: columnIndex, index: cardIndex })
                  "
                  :aria-label="card.faceUp ? cardLabel(card) : 'Face-down card'"
                  :aria-pressed="
                    sameLocation(selected, {
                      kind: 'tableau',
                      column: columnIndex,
                      index: cardIndex,
                    })
                  "
                  :disabled="!card.faceUp"
                  draggable="true"
                  @click="choose({ kind: 'tableau', column: columnIndex, index: cardIndex })"
                  @dblclick="
                    autoFoundation({ kind: 'tableau', column: columnIndex, index: cardIndex })
                  "
                  @dragstart="
                    dragStart($event, { kind: 'tableau', column: columnIndex, index: cardIndex })
                  "
                  @dragend="selected = null"
                >
                  <template v-if="card.faceUp"
                    ><span class="grid place-items-center leading-none"
                      ><span class="text-lg font-bold sm:text-xl">{{ card.rank }}</span
                      ><span
                        class="text-2xl sm:text-3xl"
                        :class="card.color === 'red' ? 'text-[#c44f52]' : 'text-[#24363a]'"
                        >{{ symbols[card.suit] }}</span
                      ></span
                    ></template
                  >
                  <span
                    v-else
                    class="text-xl text-[#a7e2c6]"
                    aria-hidden="true"
                    >✦</span
                  >
                </button>
              </div>
            </div>
          </div>

          <div
            class="mt-5 flex flex-wrap items-center justify-between gap-2 text-[0.65rem] tracking-[0.16em] text-[#a7d8c1] uppercase"
          >
            <span>Tap select · drag move</span><span>Space draw · Z undo</span>
          </div>
        </div>

        <div
          v-if="status === 'ready' || status === 'over'"
          class="absolute inset-0 z-20 grid place-items-center bg-[#08221f]/80 p-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="status === 'ready' ? 'solitaire-start-title' : 'solitaire-over-title'"
        >
          <div
            class="grid w-full max-w-sm gap-4 rounded-lg border border-[#74c8ad]/35 bg-[#123b35] p-6 text-center shadow-2xl"
          >
            <div
              class="mx-auto grid size-12 place-items-center rounded-md bg-[#f4bd68] text-2xl text-[#19322e]"
              aria-hidden="true"
            >
              ♠
            </div>
            <h2
              :id="status === 'ready' ? 'solitaire-start-title' : 'solitaire-over-title'"
              class="text-lg font-semibold text-[#f7efd9]"
            >
              {{ status === "ready" ? "Deal yourself a quiet hand" : "Table cleared" }}
            </h2>
            <p class="text-sm leading-6 text-[#c4ded1]">
              {{
                status === "ready"
                  ? "Move cards in alternating colors, reveal the tableau, and build all four foundations."
                  : dialogCopy
              }}
            </p>
            <p
              v-if="status === 'over'"
              class="font-mono text-xs tracking-[0.14em] text-[#f4bd68] uppercase"
            >
              {{ moves }} moves · {{ score }} points<span v-if="bestScore === score">
                · best score</span
              >
            </p>
            <UButton
              :label="status === 'ready' ? 'Deal cards' : 'Deal again'"
              :icon="status === 'ready' ? 'i-tabler-player-play-filled' : 'i-tabler-refresh'"
              size="lg"
              class="mx-auto"
              @click="status === 'ready' ? start() : newDeal()"
            />
            <p class="font-mono text-xs text-[#a7d8c1]">Tap or drag · no account needed</p>
          </div>
        </div>
      </section>
      <p class="text-muted text-center font-mono text-xs">
        Build four foundations · local deck · no account needed
      </p>
    </div>
  </ToolWorkbench>
</template>
