<script setup lang="ts">
type Direction = "across" | "down";
type ClueState = "loading" | "ready" | "fallback";

interface Entry {
  number: number;
  direction: Direction;
  row: number;
  column: number;
  cells: number[];
  answer: string;
}

interface WordSoHardResponse {
  found?: boolean;
  definitions?: Array<{ definition?: string }>;
}

// An original 15 × 15 blocked puzzle. The mask is rotationally symmetric;
// every open cell belongs to a real Across and/or Down entry.
const puzzleRows = [
  "EACH#ISSUE#HELP",
  "X#H###U#S###X#A",
  "AMAZING#EXACTLY",
  "M#R#N#A#D#G#R#M",
  "PLATFORM#CREATE",
  "L#C#O###I#I###N",
  "ENTERTAIN#COAST",
  "##E#M#L#T#U#R##",
  "MARIA#SPOTLIGHT",
  "A###T#O###T#E#O",
  "JUSTIN#RETURNED",
  "E#W#O#B#S#R#T#D",
  "SCIENCE#SPECIAL",
  "T#N###S#A###N#E",
  "YOGA#STAYS#HAIR",
] as const;

const rowCount = puzzleRows.length;
const columnCount = puzzleRows[0].length;
const cellCount = rowCount * columnCount;
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const fallbackClues: Record<string, string> = {
  EACH: "Every one considered separately",
  ISSUE: "A topic for discussion",
  HELP: "Give assistance",
  AMAZING: "Remarkably impressive",
  EXACTLY: "Precisely; no more or less",
  PLATFORM: "A raised surface or software base",
  CREATE: "Bring something into existence",
  ENTERTAIN: "Amuse or hold attention",
  COAST: "Shoreline beside the sea",
  MARIA: "A given name",
  SPOTLIGHT: "Focused stage light",
  JUSTIN: "A given name",
  RETURNED: "Came back",
  SCIENCE: "Systematic study of the natural world",
  SPECIAL: "Different from the ordinary",
  YOGA: "Mind-and-body practice",
  STAYS: "Remains in place",
  HAIR: "Strands growing from skin",
  EXAMPLE: "A representative case",
  CHARACTER: "A person in a story or a trait",
  SUGAR: "Sweet crystalline ingredient",
  USED: "Previously owned or employed",
  EXTRA: "More than expected",
  PAYMENT: "Money given for something",
  INFORMATION: "Knowledge or facts",
  AGRICULTURE: "Cultivation of crops and animals",
  INTO: "Moving to the inside of",
  ALSO: "In addition",
  ARGENTINA: "South American country",
  MAJESTY: "Grandeur or royal title",
  TODDLER: "A young child learning to walk",
  SWING: "Move back and forth",
  ESSAY: "Short piece of writing",
  BEST: "Of the highest quality",
};

function isOpen(index: number) {
  return puzzleRows[Math.floor(index / columnCount)]![index % columnCount] !== "#";
}

function makeEntries() {
  const entries: Entry[] = [];
  const starts = new Map<number, number>();
  let nextNumber = 1;

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const index = row * columnCount + column;
      if (!isOpen(index)) continue;
      const startsAcross = column === 0 || !isOpen(index - 1);
      const startsDown = row === 0 || !isOpen(index - columnCount);
      const acrossCells: number[] = [];
      const downCells: number[] = [];

      if (startsAcross) {
        for (let cursor = index; cursor < row * columnCount + columnCount; cursor += 1) {
          if (!isOpen(cursor)) break;
          acrossCells.push(cursor);
        }
      }
      if (startsDown) {
        for (let cursor = index; cursor < cellCount; cursor += columnCount) {
          if (!isOpen(cursor)) break;
          downCells.push(cursor);
        }
      }

      const hasAcross = acrossCells.length >= 3;
      const hasDown = downCells.length >= 3;
      if (!hasAcross && !hasDown) continue;

      const number = nextNumber;
      nextNumber += 1;
      starts.set(index, number);

      if (hasAcross) {
        entries.push({
          number,
          direction: "across",
          row,
          column,
          cells: acrossCells,
          answer: acrossCells
            .map((cell) => puzzleRows[Math.floor(cell / columnCount)]![cell % columnCount])
            .join(""),
        });
      }
      if (hasDown) {
        entries.push({
          number,
          direction: "down",
          row,
          column,
          cells: downCells,
          answer: downCells
            .map((cell) => puzzleRows[Math.floor(cell / columnCount)]![cell % columnCount])
            .join(""),
        });
      }
    }
  }
  return { entries, starts };
}

const { entries, starts: cellNumbers } = makeEntries();
const answers = [...new Set(entries.map((entry) => entry.answer))];

const letters = ref<string[]>(Array<string>(cellCount).fill(""));
const clueMap = ref<Record<string, string>>({});
const clueState = ref<ClueState>("loading");
const selectedIndex = ref(entries[0]?.cells[0] ?? 0);
const direction = ref<Direction>("across");
const checked = ref(false);
const completed = ref(false);
const feedback = ref("Choose a square or clue to begin.");
const elapsed = ref(0);
const hintsUsed = ref(0);
const showMobileClues = ref(false);
const stage = ref<HTMLElement | null>(null);

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    if (!completed.value) elapsed.value += 1;
  },
  1000,
  { immediate: false },
);

const acrossEntries = computed(() => entries.filter((entry) => entry.direction === "across"));
const downEntries = computed(() => entries.filter((entry) => entry.direction === "down"));
const activeEntry = computed(() => {
  const matching = entries.find(
    (entry) => entry.direction === direction.value && entry.cells.includes(selectedIndex.value),
  );
  return matching ?? entries.find((entry) => entry.cells.includes(selectedIndex.value));
});
const progress = computed(() =>
  letters.value.reduce((total, letter, index) => total + (isOpen(index) && letter ? 1 : 0), 0),
);
const openCellCount = computed(() => puzzleRows.join("").replaceAll("#", "").length);
const progressLabel = computed(() => `${progress.value}/${openCellCount.value}`);
const timeLabel = computed(
  () =>
    `${String(Math.floor(elapsed.value / 60)).padStart(2, "0")}:${String(elapsed.value % 60).padStart(2, "0")}`,
);
const activeClue = computed(() =>
  activeEntry.value
    ? (clueMap.value[activeEntry.value.answer] ?? fallbackClues[activeEntry.value.answer])
    : "",
);
const clueStatusLabel = computed(() => {
  if (clueState.value === "loading") return "Loading open dictionary clues…";
  if (clueState.value === "fallback") return "Some clues are using local fallbacks.";
  return "Clues enriched from WordSoHard.";
});
const errors = computed(
  () =>
    new Set(
      letters.value.flatMap((letter, index) => {
        if (!letter || !isOpen(index)) return [];
        const answer = puzzleRows[Math.floor(index / columnCount)]![index % columnCount];
        return letter !== answer ? [index] : [];
      }),
    ),
);

function clueFor(entry: Entry) {
  return (
    clueMap.value[entry.answer] ??
    fallbackClues[entry.answer] ??
    `${entry.answer.length}-letter word`
  );
}

async function fetchClues() {
  const results = await Promise.allSettled(
    answers.map(async (answer) => {
      const response = await fetch(
        `https://wordsohard.com/api/v1/define/${encodeURIComponent(answer.toLowerCase())}`,
      );
      if (!response.ok) throw new Error(`Clue request failed for ${answer}`);
      const data = (await response.json()) as WordSoHardResponse;
      const definition = data.definitions?.find((item) => item.definition)?.definition;
      if (!data.found || !definition) throw new Error(`No definition for ${answer}`);
      return { answer, definition };
    }),
  );

  const fetched: Record<string, string> = {};
  let missed = false;
  for (const result of results) {
    if (result.status === "fulfilled") fetched[result.value.answer] = result.value.definition;
    else missed = true;
  }
  clueMap.value = fetched;
  clueState.value = missed ? "fallback" : "ready";
}

function focusStage() {
  stage.value?.focus();
}
function cellNumber(index: number) {
  return cellNumbers.get(index);
}
function entryForCell(index: number, wantedDirection: Direction) {
  return entries.find(
    (entry) => entry.direction === wantedDirection && entry.cells.includes(index),
  );
}
function isInActiveEntry(index: number) {
  return activeEntry.value?.cells.includes(index) ?? false;
}

function selectCell(index: number) {
  if (!isOpen(index)) return;
  if (selectedIndex.value === index) {
    const alternate = direction.value === "across" ? "down" : "across";
    if (entryForCell(index, alternate)) direction.value = alternate;
  } else if (!entryForCell(index, direction.value)) {
    direction.value = direction.value === "across" ? "down" : "across";
  }
  selectedIndex.value = index;
  checked.value = false;
  feedback.value = `${activeEntry.value?.number} ${activeEntry.value?.direction}: ${activeClue.value}`;
  focusStage();
}

function moveWithinEntry(step: 1 | -1) {
  const cells = activeEntry.value?.cells ?? [];
  const current = cells.indexOf(selectedIndex.value);
  const next = current + step;
  if (next >= 0 && next < cells.length) selectedIndex.value = cells[next]!;
}

function moveSelection(rowDelta: number, columnDelta: number) {
  let row = Math.floor(selectedIndex.value / columnCount) + rowDelta;
  let column = (selectedIndex.value % columnCount) + columnDelta;
  while (row >= 0 && row < rowCount && column >= 0 && column < columnCount) {
    const index = row * columnCount + column;
    if (isOpen(index)) {
      selectedIndex.value = index;
      focusStage();
      return;
    }
    row += rowDelta;
    column += columnDelta;
  }
}

function placeLetter(value: string) {
  const letter = value.toUpperCase();
  if (!/^[A-Z]$/.test(letter) || completed.value || !isOpen(selectedIndex.value)) return;
  letters.value[selectedIndex.value] = letter;
  letters.value = [...letters.value];
  checked.value = false;
  feedback.value = "Letter placed.";
  moveWithinEntry(1);
  if (openCellCount.value === progress.value && errors.value.size === 0) finish();
}

function clearLetter() {
  if (completed.value) return;
  if (letters.value[selectedIndex.value]) letters.value[selectedIndex.value] = "";
  else moveWithinEntry(-1);
  letters.value = [...letters.value];
  checked.value = false;
  feedback.value = "Square cleared.";
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    direction.value = "across";
    moveSelection(0, -1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    direction.value = "across";
    moveSelection(0, 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    direction.value = "down";
    moveSelection(-1, 0);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    direction.value = "down";
    moveSelection(1, 0);
  } else if (event.key === "Backspace") {
    event.preventDefault();
    clearLetter();
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    direction.value = direction.value === "across" ? "down" : "across";
  } else if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    placeLetter(event.key);
  }
}

function selectEntry(entry: Entry) {
  selectedIndex.value = entry.cells[0]!;
  direction.value = entry.direction;
  checked.value = false;
  feedback.value = `${entry.number} ${entry.direction}: ${clueFor(entry)}`;
  showMobileClues.value = false;
  focusStage();
}
function nextEntry(step: 1 | -1) {
  const list = direction.value === "across" ? acrossEntries.value : downEntries.value;
  const current = list.findIndex(
    (entry) => entry.number === activeEntry.value?.number && entry.row === activeEntry.value?.row,
  );
  selectEntry(list[(current + step + list.length) % list.length]!);
}
function checkPuzzle() {
  checked.value = true;
  const correct = letters.value.reduce((total, letter, index) => {
    if (!letter || !isOpen(index)) return total;
    return (
      total + (letter === puzzleRows[Math.floor(index / columnCount)]![index % columnCount] ? 1 : 0)
    );
  }, 0);
  if (correct === openCellCount.value && progress.value === openCellCount.value) finish();
  else feedback.value = `${correct}/${openCellCount.value} squares are correct.`;
}
function revealLetter() {
  if (!activeEntry.value) return;
  const answer =
    puzzleRows[Math.floor(selectedIndex.value / columnCount)]![selectedIndex.value % columnCount]!;
  letters.value[selectedIndex.value] = answer;
  letters.value = [...letters.value];
  hintsUsed.value += 1;
  checked.value = false;
  feedback.value = "One letter revealed.";
  moveWithinEntry(1);
  if (progress.value === openCellCount.value && errors.value.size === 0) finish();
}
function revealWord() {
  if (!activeEntry.value) return;
  for (const index of activeEntry.value.cells)
    letters.value[index] = puzzleRows[Math.floor(index / columnCount)]![index % columnCount]!;
  letters.value = [...letters.value];
  hintsUsed.value += 1;
  checked.value = false;
  feedback.value = `${activeEntry.value.number} ${activeEntry.value.direction} revealed.`;
  if (progress.value === openCellCount.value && errors.value.size === 0) finish();
}
function revealPuzzle() {
  letters.value = puzzleRows
    .join("")
    .split("")
    .map((letter) => (letter === "#" ? "" : letter));
  hintsUsed.value += 1;
  checked.value = false;
  feedback.value = "Puzzle revealed.";
  finish();
}
function finish() {
  if (completed.value) return;
  completed.value = true;
  checked.value = false;
  feedback.value = hintsUsed.value
    ? `Solved in ${timeLabel.value} with ${hintsUsed.value} hint${hintsUsed.value === 1 ? "" : "s"}.`
    : `Solved in ${timeLabel.value}. Lovely work.`;
  pauseTimer();
}
function reset() {
  letters.value = Array<string>(cellCount).fill("");
  selectedIndex.value = entries[0]?.cells[0] ?? 0;
  direction.value = "across";
  checked.value = false;
  completed.value = false;
  feedback.value = "Choose a square or clue to begin.";
  elapsed.value = 0;
  hintsUsed.value = 0;
  pauseTimer();
  resumeTimer();
  focusStage();
}

onMounted(() => {
  resumeTimer();
  void fetchClues();
});
onBeforeUnmount(() => pauseTimer());
</script>

<template>
  <ToolWorkbench
    description="A traditional blocked-grid crossword with keyboard-first solving and dictionary-backed clues."
  >
    <div class="mx-auto grid max-w-7xl gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <UBadge
            label="Daily grid 01"
            color="neutral"
            variant="subtle"
          />
          <span class="text-sm text-zinc-600 dark:text-zinc-400"
            >15 × 15 · symmetrical blocks · {{ entries.length }} clues</span
          >
        </div>
        <div
          class="flex items-center gap-4 font-mono text-sm text-zinc-600 tabular-nums dark:text-zinc-400"
        >
          <span class="inline-flex items-center gap-1.5"
            ><Icon
              name="tabler:clock"
              class="size-4"
              aria-hidden="true"
            />{{ timeLabel }}</span
          >
          <span>{{ progressLabel }}</span>
          <UButton
            class="lg:hidden"
            label="Clues"
            icon="i-tabler-list"
            color="neutral"
            variant="outline"
            size="sm"
            @click="showMobileClues = !showMobileClues"
          />
        </div>
      </div>

      <UCard
        :ui="{
          root: 'overflow-hidden border border-black/20 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white',
          header:
            'border-b border-black/10 bg-white px-4 py-3 sm:px-5 dark:border-white/15 dark:bg-black',
          body: 'p-0',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <UButton
              icon="i-tabler-chevron-left"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Previous clue"
              @click="nextEntry(-1)"
            />
            <p class="min-w-0 flex-1 truncate text-center text-sm sm:text-base">
              <strong class="text-black dark:text-white"
                >{{ activeEntry?.number }} {{ activeEntry?.direction }}</strong
              ><span class="text-zinc-600 dark:text-zinc-400"> · {{ activeClue }}</span>
            </p>
            <UButton
              icon="i-tabler-chevron-right"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Next clue"
              @click="nextEntry(1)"
            />
          </div>
        </template>

        <div class="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section
            ref="stage"
            class="grid min-w-0 gap-4 p-3 outline-none sm:p-6"
            aria-label="Crossword board"
            tabindex="0"
            @keydown="handleKeydown"
          >
            <div
              class="mx-auto grid aspect-square w-full max-w-[52rem] grid-cols-[repeat(15,minmax(0,1fr))] gap-px border border-black/80 bg-black p-1 shadow-sm sm:gap-1 sm:p-2 dark:border-white/80"
            >
              <template
                v-for="(letter, index) in letters"
                :key="index"
              >
                <div
                  v-if="!isOpen(index)"
                  class="aspect-square bg-black"
                  aria-hidden="true"
                />
                <button
                  v-else
                  type="button"
                  class="relative aspect-square min-h-5 bg-white text-[0.7rem] font-semibold text-black transition-colors select-none hover:bg-zinc-100 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-500 sm:text-base"
                  :class="[
                    isInActiveEntry(index) ? 'bg-zinc-100 dark:bg-zinc-200' : '',
                    checked && errors.has(index)
                      ? 'bg-zinc-300 text-black outline-2 outline-black/70'
                      : '',
                    selectedIndex === index
                      ? 'outline-primary ring-primary/70 z-10 bg-black text-white ring-1 outline-2'
                      : '',
                  ]"
                  :aria-label="`Row ${Math.floor(index / columnCount) + 1}, column ${(index % columnCount) + 1}${letter ? `, ${letter}` : ', empty'}`"
                  :aria-pressed="selectedIndex === index"
                  @click="selectCell(index)"
                >
                  <span
                    v-if="cellNumber(index)"
                    class="absolute top-0.5 left-1 text-[0.45rem] font-medium text-zinc-500 sm:top-1 sm:left-1.5 sm:text-[0.6rem]"
                    :class="selectedIndex === index ? 'text-zinc-300' : ''"
                    aria-hidden="true"
                    >{{ cellNumber(index) }}</span
                  >
                  <span class="absolute inset-0 grid place-items-center pt-1">{{ letter }}</span>
                </button>
              </template>
            </div>

            <div
              class="mx-auto flex w-full max-w-[52rem] flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 dark:border-white/15"
            >
              <p
                class="min-h-5 text-sm text-zinc-600 dark:text-zinc-400"
                role="status"
                aria-live="polite"
              >
                {{ feedback }}
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  label="Check"
                  icon="i-tabler-check"
                  color="neutral"
                  variant="solid"
                  size="sm"
                  :disabled="completed"
                  @click="checkPuzzle"
                />
                <UButton
                  label="Reveal letter"
                  icon="i-tabler-bulb"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :disabled="completed"
                  @click="revealLetter"
                />
                <UButton
                  label="Reveal word"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :disabled="completed"
                  @click="revealWord"
                />
                <UButton
                  label="Reset"
                  icon="i-tabler-refresh"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="reset"
                />
              </div>
            </div>

            <div
              class="mx-auto grid w-full max-w-[52rem] gap-1.5 rounded-lg bg-zinc-100 p-2 sm:hidden dark:bg-zinc-900"
              aria-label="On-screen keyboard"
            >
              <div
                v-for="row in keyboardRows"
                :key="row"
                class="flex justify-center gap-1"
              >
                <UButton
                  v-for="letter in row"
                  :key="letter"
                  :label="letter"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="min-w-7 px-1.5 font-mono"
                  :disabled="completed"
                  @click="placeLetter(letter)"
                />
              </div>
              <div class="flex justify-center gap-1">
                <UButton
                  label="Delete"
                  icon="i-tabler-backspace"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  :disabled="completed"
                  @click="clearLetter"
                /><UButton
                  label="Switch direction"
                  icon="i-tabler-arrows-left-right"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  :disabled="completed"
                  @click="direction = direction === 'across' ? 'down' : 'across'"
                />
              </div>
            </div>
            <UAlert
              v-if="completed"
              color="neutral"
              variant="subtle"
              icon="i-tabler-confetti"
              title="Puzzle complete"
              :description="feedback"
            />
          </section>

          <aside
            class="hidden border-t border-black/10 bg-white p-4 text-black sm:p-5 lg:block lg:max-h-[48rem] lg:overflow-y-auto lg:border-t-0 lg:border-l dark:border-white/15 dark:bg-black dark:text-white"
            aria-label="Clue list"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-black dark:text-white">Clues</h2>
                <p class="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{{ clueStatusLabel }}</p>
              </div>
              <UBadge
                :label="progressLabel"
                color="neutral"
                variant="subtle"
              />
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <section
                class="flex h-72 min-h-0 flex-col overflow-hidden rounded-lg border border-black/10 lg:h-[20rem] dark:border-white/15"
                aria-labelledby="across-clues"
              >
                <div
                  class="flex items-center justify-between border-b border-black/10 px-3 py-2 dark:border-white/15"
                >
                  <h3
                    id="across-clues"
                    class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400"
                  >
                    Across
                  </h3>
                  <span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{{
                    acrossEntries.length
                  }}</span>
                </div>
                <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
                  <button
                    v-for="entry in acrossEntries"
                    :key="`across-${entry.number}-${entry.row}-${entry.column}`"
                    type="button"
                    class="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    :class="
                      activeEntry?.direction === entry.direction &&
                      activeEntry?.number === entry.number &&
                      activeEntry?.row === entry.row
                        ? 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white'
                        : ''
                    "
                    @click="selectEntry(entry)"
                  >
                    <strong class="w-6 shrink-0 font-mono text-xs">{{ entry.number }}</strong
                    ><span
                      >{{ clueFor(entry) }}
                      <span class="text-zinc-500 dark:text-zinc-400"
                        >({{ entry.answer.length }})</span
                      ></span
                    >
                  </button>
                </div>
              </section>
              <section
                class="flex h-72 min-h-0 flex-col overflow-hidden rounded-lg border border-black/10 lg:h-[20rem] dark:border-white/15"
                aria-labelledby="down-clues"
              >
                <div
                  class="flex items-center justify-between border-b border-black/10 px-3 py-2 dark:border-white/15"
                >
                  <h3
                    id="down-clues"
                    class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400"
                  >
                    Down
                  </h3>
                  <span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{{
                    downEntries.length
                  }}</span>
                </div>
                <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
                  <button
                    v-for="entry in downEntries"
                    :key="`down-${entry.number}-${entry.row}-${entry.column}`"
                    type="button"
                    class="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    :class="
                      activeEntry?.direction === entry.direction &&
                      activeEntry?.number === entry.number &&
                      activeEntry?.row === entry.row
                        ? 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white'
                        : ''
                    "
                    @click="selectEntry(entry)"
                  >
                    <strong class="w-6 shrink-0 font-mono text-xs">{{ entry.number }}</strong
                    ><span
                      >{{ clueFor(entry) }}
                      <span class="text-zinc-500 dark:text-zinc-400"
                        >({{ entry.answer.length }})</span
                      ></span
                    >
                  </button>
                </div>
              </section>
            </div>
          </aside>

          <USlideover
            v-model:open="showMobileClues"
            side="right"
            title="Clues"
            description="Browse Across and Down clues."
            :ui="{
              content: 'w-[min(92vw,24rem)] bg-white text-black dark:bg-black dark:text-white',
              body: 'p-0',
            }"
          >
            <template #body>
              <div class="grid gap-4 p-4 sm:p-5">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs text-zinc-600 dark:text-zinc-400">{{ clueStatusLabel }}</p>
                  <UBadge
                    :label="progressLabel"
                    color="neutral"
                    variant="subtle"
                  />
                </div>
                <div class="grid gap-4">
                  <section
                    class="flex h-72 min-h-0 flex-col overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
                    aria-labelledby="mobile-across-clues"
                  >
                    <div
                      class="flex items-center justify-between border-b border-black/10 px-3 py-2 dark:border-white/15"
                    >
                      <h3
                        id="mobile-across-clues"
                        class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400"
                      >
                        Across
                      </h3>
                      <span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{{
                        acrossEntries.length
                      }}</span>
                    </div>
                    <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
                      <button
                        v-for="entry in acrossEntries"
                        :key="`mobile-across-${entry.number}-${entry.row}-${entry.column}`"
                        type="button"
                        class="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        :class="
                          activeEntry?.direction === entry.direction &&
                          activeEntry?.number === entry.number &&
                          activeEntry?.row === entry.row
                            ? 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white'
                            : ''
                        "
                        @click="selectEntry(entry)"
                      >
                        <strong class="w-6 shrink-0 font-mono text-xs">{{ entry.number }}</strong
                        ><span
                          >{{ clueFor(entry) }}
                          <span class="text-zinc-500 dark:text-zinc-400"
                            >({{ entry.answer.length }})</span
                          ></span
                        >
                      </button>
                    </div>
                  </section>
                  <section
                    class="flex h-72 min-h-0 flex-col overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
                    aria-labelledby="mobile-down-clues"
                  >
                    <div
                      class="flex items-center justify-between border-b border-black/10 px-3 py-2 dark:border-white/15"
                    >
                      <h3
                        id="mobile-down-clues"
                        class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400"
                      >
                        Down
                      </h3>
                      <span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{{
                        downEntries.length
                      }}</span>
                    </div>
                    <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
                      <button
                        v-for="entry in downEntries"
                        :key="`mobile-down-${entry.number}-${entry.row}-${entry.column}`"
                        type="button"
                        class="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        :class="
                          activeEntry?.direction === entry.direction &&
                          activeEntry?.number === entry.number &&
                          activeEntry?.row === entry.row
                            ? 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white'
                            : ''
                        "
                        @click="selectEntry(entry)"
                      >
                        <strong class="w-6 shrink-0 font-mono text-xs">{{ entry.number }}</strong
                        ><span
                          >{{ clueFor(entry) }}
                          <span class="text-zinc-500 dark:text-zinc-400"
                            >({{ entry.answer.length }})</span
                          ></span
                        >
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </template>
          </USlideover>
        </div>
      </UCard>

      <div
        class="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-zinc-600 dark:text-zinc-400"
      >
        <span>Arrow keys move · Space/Enter switches direction · Backspace clears</span>
        <div class="flex items-center gap-3">
          <span
            >Open definitions by
            <ULink
              class="text-black underline dark:text-white"
              to="https://wordsohard.com/api"
              target="_blank"
              rel="noopener"
              >WordSoHard</ULink
            ></span
          ><UButton
            label="Reveal puzzle"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="completed"
            @click="revealPuzzle"
          />
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
