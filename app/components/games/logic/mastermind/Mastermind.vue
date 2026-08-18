<script setup lang="ts">
type GamePhase = "loading" | "ready" | "playing" | "won" | "lost";
type PegId = "ruby" | "ocean" | "jade" | "sun" | "violet" | "coral";

interface Attempt {
  value: PegId[];
  exact: number;
  close: number;
}

const palette = [
  { id: "ruby", label: "Ruby", number: 1 },
  { id: "ocean", label: "Ocean", number: 2 },
  { id: "jade", label: "Jade", number: 3 },
  { id: "sun", label: "Sun", number: 4 },
  { id: "violet", label: "Violet", number: 5 },
  { id: "coral", label: "Coral", number: 6 },
] as const satisfies ReadonlyArray<{ id: PegId; label: string; number: number }>;

const codeLength = 4;
const maxAttempts = 8;
const phase = ref<GamePhase>("loading");
const code = ref<PegId[]>(makeCode());
const currentGuess = ref<Array<PegId | null>>(emptyGuess());
const attempts = ref<Attempt[]>([]);
const selectedSlot = ref(0);
const notice = ref("Choose a color for each slot.");
const loadingProgress = ref(12);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;

const isDone = computed(() => phase.value === "won" || phase.value === "lost");
const isWon = computed(() => phase.value === "won");
const guessCount = computed(() => currentGuess.value.filter(Boolean).length);
const canSubmit = computed(() => guessCount.value === codeLength && phase.value === "playing");
const codeLabel = computed(() => code.value.map(pegLabel).join(" · "));
const statusText = computed(() => {
  if (phase.value === "loading") return "Preparing the code room…";
  if (phase.value === "ready") return "A fresh code is waiting behind the lock.";
  if (phase.value === "won") return "Code cracked. Excellent deduction.";
  if (phase.value === "lost") return "No attempts left. The code is revealed below.";
  return notice.value;
});
const attemptRows = computed(() =>
  Array.from({ length: maxAttempts }, (_, index) => attempts.value[index] ?? null),
);

function emptyGuess(): Array<PegId | null> {
  return Array.from({ length: codeLength }).fill(null) as Array<PegId | null>;
}

function makeCode(): PegId[] {
  return Array.from(
    { length: codeLength },
    () => palette[Math.floor(Math.random() * palette.length)]!.id,
  );
}

function pegLabel(peg: PegId) {
  return palette.find((item) => item.id === peg)?.label ?? peg;
}

function scoreGuess(value: PegId[]) {
  let exact = 0;
  const remainingCode = new Map<PegId, number>();
  const remainingGuess: PegId[] = [];

  value.forEach((peg, index) => {
    if (peg === code.value[index]) exact += 1;
    else remainingGuess.push(peg);
  });
  code.value.forEach((peg, index) => {
    if (peg !== value[index]) remainingCode.set(peg, (remainingCode.get(peg) ?? 0) + 1);
  });

  let close = 0;
  for (const peg of remainingGuess) {
    const count = remainingCode.get(peg) ?? 0;
    if (count > 0) {
      close += 1;
      remainingCode.set(peg, count - 1);
    }
  }
  return { exact, close };
}

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function startGame() {
  code.value = makeCode();
  currentGuess.value = emptyGuess();
  attempts.value = [];
  selectedSlot.value = 0;
  notice.value = "Choose a color for each slot.";
  phase.value = "playing";
}

function selectSlot(index: number) {
  if (phase.value !== "playing") return;
  selectedSlot.value = index;
  notice.value = `Slot ${index + 1} selected.`;
}

function selectPeg(peg: PegId) {
  if (phase.value !== "playing") return;
  const nextGuess = [...currentGuess.value];
  nextGuess[selectedSlot.value] = peg;
  currentGuess.value = nextGuess;
  const nextEmpty = nextGuess.findIndex((item) => item === null);
  selectedSlot.value = nextEmpty >= 0 ? nextEmpty : selectedSlot.value;
  notice.value = nextEmpty >= 0 ? "Keep building the code." : "Code ready. Check your guess.";
}

function clearSelectedSlot() {
  if (phase.value !== "playing") return;
  const nextGuess = [...currentGuess.value];
  const slot =
    nextGuess[selectedSlot.value] === null
      ? Math.max(0, selectedSlot.value - 1)
      : selectedSlot.value;
  nextGuess[slot] = null;
  currentGuess.value = nextGuess;
  selectedSlot.value = slot;
  notice.value = "Slot cleared.";
}

function submit() {
  if (!canSubmit.value) {
    notice.value = "Fill all four slots before checking.";
    return;
  }

  const value = currentGuess.value as PegId[];
  const result = scoreGuess(value);
  attempts.value = [...attempts.value, { value: [...value], ...result }];
  currentGuess.value = emptyGuess();
  selectedSlot.value = 0;

  if (result.exact === codeLength) {
    phase.value = "won";
    notice.value = "Code cracked. Excellent deduction.";
  } else if (attempts.value.length === maxAttempts) {
    phase.value = "lost";
    notice.value = "No attempts left. The code is revealed below.";
  } else {
    notice.value = `${result.exact} exact · ${result.close} close. Keep deducing.`;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (phase.value !== "playing") return;
  if (event.target !== event.currentTarget && (event.target as HTMLElement).closest("button")) {
    return;
  }

  if (/^[1-6]$/.test(event.key)) {
    event.preventDefault();
    selectPeg(palette[Number(event.key) - 1]!.id);
  } else if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    clearSelectedSlot();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    selectedSlot.value = Math.max(
      0,
      Math.min(codeLength - 1, selectedSlot.value + (event.key === "ArrowRight" ? 1 : -1)),
    );
  } else if (event.key === "Enter") {
    event.preventDefault();
    submit();
  }
}

onMounted(() => {
  loadingTimer = setTimeout(finishLoading, 700);
});

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
  <ToolWorkbench
    description="Crack a hidden four-color code. Exact pegs match color and position; close pegs match color in another position."
  >
    <div
      class="mastermind-game"
      tabindex="0"
      aria-label="Mastermind code-breaking game"
      @keydown="handleKeydown"
    >
      <img
        src="/game-arts/mastermind.jpg"
        alt="A raccoon codebreaker arranging colored pegs beside a vault"
        class="mastermind-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="mastermind-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="mastermind-state"
      >
        <div class="mastermind-state-card">
          <UIcon
            name="i-tabler-lock-code"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="mastermind-eyebrow">Code room</p>
          <h2>Preparing the lock</h2>
          <UProgress
            :model-value="loadingProgress"
            color="primary"
            class="w-48"
            aria-label="Loading game"
          />
        </div>
      </div>

      <div
        v-else-if="phase === 'ready'"
        class="mastermind-state mastermind-state--ready"
      >
        <div class="mastermind-ready-copy">
          <UBadge
            label="Classic code room"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="mastermind-eyebrow">Six colors · eight tries</p>
          <h2>Read the clues.<br />Crack the vault.</h2>
          <p>Place the pegs, read the feedback, and narrow the possibilities one row at a time.</p>
          <UButton
            label="Start game"
            icon="i-tabler-player-play"
            color="primary"
            size="lg"
            @click="startGame"
          />
        </div>
      </div>

      <div
        v-else
        class="mastermind-layout"
      >
        <aside class="mastermind-intro">
          <p class="mastermind-eyebrow">Vault protocol</p>
          <h2>Deduction<br />beats luck.</h2>
          <p>
            Exact is the right color in the right place. Close is the right color in the wrong
            place. Empty pins are not in the code.
          </p>
        </aside>

        <section
          class="mastermind-console"
          :class="{ 'mastermind-console--done': isDone }"
          aria-label="Mastermind console"
        >
          <div
            class="mastermind-console-body"
            :class="{ 'mastermind-console-body--blurred': isDone }"
          >
            <header class="mastermind-console-header">
              <div>
                <p class="mastermind-eyebrow">Mastermind</p>
                <p
                  class="mastermind-status"
                  role="status"
                  aria-live="polite"
                >
                  {{ statusText }}
                </p>
              </div>
              <UBadge
                :label="`${attempts.length}/${maxAttempts}`"
                color="neutral"
                variant="subtle"
                class="mastermind-count"
              />
            </header>

            <div
              class="mastermind-history"
              aria-label="Guess history"
            >
              <div
                v-for="(attempt, index) in attemptRows"
                :key="index"
                class="mastermind-history-row"
                :class="{ 'mastermind-history-row--empty': !attempt }"
              >
                <span class="mastermind-attempt-number">{{ index + 1 }}</span>
                <div
                  class="mastermind-attempt-pegs"
                  :aria-label="attempt ? `Attempt ${index + 1}` : `Empty attempt ${index + 1}`"
                >
                  <template v-if="attempt">
                    <span
                      v-for="peg in attempt.value"
                      :key="`${index}-${peg}`"
                      class="mastermind-peg mastermind-peg--small"
                      :data-color="peg"
                      :aria-label="pegLabel(peg)"
                    />
                  </template>
                  <template v-else>
                    <span
                      v-for="slot in codeLength"
                      :key="slot"
                      class="mastermind-empty-peg"
                    />
                  </template>
                </div>
                <div
                  v-if="attempt"
                  class="mastermind-feedback-wrap"
                  :aria-label="`${attempt.exact} exact, ${attempt.close} close`"
                >
                  <span
                    class="mastermind-feedback-chip"
                    data-kind="exact"
                  >
                    <i aria-hidden="true" />Exact {{ attempt.exact }}
                  </span>
                  <span
                    class="mastermind-feedback-chip"
                    data-kind="close"
                  >
                    <i aria-hidden="true" />Close {{ attempt.close }}
                  </span>
                </div>
                <span
                  v-else
                  class="mastermind-no-feedback"
                >
                  No feedback yet
                </span>
              </div>
            </div>

            <div class="mastermind-controls">
              <p class="mastermind-control-label">Your next guess</p>
              <div class="mastermind-guess-slots">
                <button
                  v-for="(peg, index) in currentGuess"
                  :key="index"
                  type="button"
                  class="mastermind-slot"
                  :class="{ 'mastermind-slot--selected': selectedSlot === index }"
                  :aria-label="`Guess slot ${index + 1}${peg ? `, ${pegLabel(peg)}` : ', empty'}`"
                  :aria-pressed="selectedSlot === index"
                  @click="selectSlot(index)"
                >
                  <span
                    v-if="peg"
                    class="mastermind-peg"
                    :data-color="peg"
                  />
                  <span
                    v-else
                    class="mastermind-slot-plus"
                    aria-hidden="true"
                    >+</span
                  >
                </button>
              </div>

              <div class="mastermind-palette">
                <button
                  v-for="peg in palette"
                  :key="peg.id"
                  type="button"
                  class="mastermind-palette-button"
                  :aria-label="`Choose ${peg.label}, keyboard ${peg.number}`"
                  @click="selectPeg(peg.id)"
                >
                  <span
                    class="mastermind-peg mastermind-peg--palette"
                    :data-color="peg.id"
                  />
                  <span>{{ peg.number }}</span>
                </button>
              </div>

              <div class="mastermind-actions">
                <div class="flex items-center gap-2">
                  <UButton
                    label="Clear"
                    icon="i-tabler-backspace"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :disabled="guessCount === 0"
                    @click="clearSelectedSlot"
                  />
                  <UButton
                    label="Check"
                    icon="i-tabler-check"
                    color="primary"
                    size="sm"
                    :disabled="!canSubmit"
                    @click="submit"
                  />
                </div>
                <UButton
                  label="New code"
                  icon="i-tabler-refresh"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="startGame"
                />
              </div>

              <div class="mastermind-legend">
                <span><i data-kind="exact" />Exact place</span>
                <span><i data-kind="close" />Right color</span>
                <span><i data-kind="miss" />Not in code</span>
              </div>
              <p class="mastermind-hint">Keys 1–6 choose · arrows move · Enter checks</p>
            </div>
          </div>

          <div
            v-if="isDone"
            class="mastermind-result"
          >
            <UIcon
              :name="isWon ? 'i-tabler-lock-open-2' : 'i-tabler-lock-exclamation'"
              class="text-primary size-9"
              aria-hidden="true"
            />
            <p class="mastermind-eyebrow">{{ isWon ? "Vault open" : "Code room reset" }}</p>
            <h2>{{ isWon ? "You cracked it." : "That one got away." }}</h2>
            <div
              class="mastermind-revealed-code"
              role="img"
              :aria-label="`Secret code: ${codeLabel}`"
            >
              <span
                v-for="(peg, index) in code"
                :key="index"
                class="mastermind-peg"
                :data-color="peg"
              />
            </div>
            <p class="sr-only">Secret code: {{ codeLabel }}</p>
            <UButton
              label="Play again"
              icon="i-tabler-player-play"
              color="primary"
              @click="startGame"
            />
          </div>
        </section>
      </div>
    </div>

    <p class="text-muted mt-4 text-sm leading-6">
      Runs locally in this tab. No code or guesses leave your browser.
    </p>
  </ToolWorkbench>
</template>

<style scoped>
.mastermind-game {
  --mastermind-accent: #fb923c;
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  min-height: 42rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 1.25rem;
  background: #0b0d12;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.28);
  outline: none;
}

.mastermind-game:focus-visible {
  box-shadow:
    0 0 0 2px rgb(251 146 60 / 0.75),
    0 24px 70px rgb(0 0 0 / 0.28);
}

.mastermind-art,
.mastermind-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mastermind-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.mastermind-art-wash {
  z-index: -1;
  background:
    linear-gradient(90deg, rgb(7 9 14 / 0.94) 0%, rgb(7 9 14 / 0.72) 39%, rgb(7 9 14 / 0.56) 100%),
    rgb(6 8 12 / 0.22);
}

.mastermind-state,
.mastermind-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.mastermind-state {
  display: grid;
  place-items: center;
  text-align: center;
  color: white;
}

.mastermind-state-card,
.mastermind-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 2rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 1rem;
  background: rgb(12 15 22 / 0.85);
  box-shadow: 0 22px 60px rgb(0 0 0 / 0.32);
  backdrop-filter: blur(14px);
}

.mastermind-state-card h2,
.mastermind-ready-copy h2,
.mastermind-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.mastermind-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.mastermind-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.mastermind-ready-copy > p:not(.mastermind-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.mastermind-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.mastermind-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.mastermind-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.mastermind-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.mastermind-console {
  position: relative;
  min-width: 0;
  align-self: center;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 1.25rem;
  background: rgb(15 18 25 / 0.94);
  color: white;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.46);
  backdrop-filter: blur(18px);
}

.mastermind-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.mastermind-console-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.mastermind-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 0.92rem;
}

.mastermind-count {
  background: rgb(255 255 255 / 0.1);
  color: white;
}

.mastermind-history {
  display: grid;
  min-width: 0;
  gap: 0.5rem;
}

.mastermind-history-row {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  min-height: 3.15rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid rgb(255 255 255 / 0.13);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.055);
  animation: mastermind-row-in 180ms ease-out;
}

.mastermind-history-row--empty {
  opacity: 0.72;
}

.mastermind-attempt-number {
  color: rgb(255 255 255 / 0.4);
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.mastermind-attempt-pegs {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.45rem;
}

.mastermind-peg,
.mastermind-empty-peg,
.mastermind-feedback-chip i,
.mastermind-legend i {
  display: inline-block;
  flex: 0 0 auto;
  border-radius: 9999px;
}

.mastermind-peg {
  position: relative;
  width: 2.55rem;
  height: 2.55rem;
  border: 2px solid rgb(255 255 255 / 0.28);
  background: #555;
  box-shadow:
    inset 0 2px 3px rgb(255 255 255 / 0.42),
    inset 0 -3px 5px rgb(0 0 0 / 0.32),
    0 2px 5px rgb(0 0 0 / 0.3);
}

.mastermind-peg--small {
  width: 1.65rem;
  height: 1.65rem;
}
.mastermind-peg--palette {
  width: 1.6rem;
  height: 1.6rem;
  border-width: 1px;
}

.mastermind-peg::after {
  position: absolute;
  top: 15%;
  left: 20%;
  width: 25%;
  height: 18%;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.65);
  content: "";
  filter: blur(1px);
}

.mastermind-peg[data-color="ruby"] {
  background: linear-gradient(145deg, #ff858e, #b91c3c);
}
.mastermind-peg[data-color="ocean"] {
  background: linear-gradient(145deg, #72c8ff, #1769aa);
}
.mastermind-peg[data-color="jade"] {
  background: linear-gradient(145deg, #78e0aa, #16865b);
}
.mastermind-peg[data-color="sun"] {
  background: linear-gradient(145deg, #ffe184, #d98516);
}
.mastermind-peg[data-color="violet"] {
  background: linear-gradient(145deg, #d0a0ff, #7040a4);
}
.mastermind-peg[data-color="coral"] {
  background: linear-gradient(145deg, #ffb08b, #d04f2f);
}

.mastermind-empty-peg {
  width: 1.65rem;
  height: 1.65rem;
  border: 1px dashed rgb(255 255 255 / 0.25);
  background: rgb(255 255 255 / 0.025);
}

.mastermind-feedback-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  min-width: 0;
}

.mastermind-feedback-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 9999px;
  color: rgb(255 255 255 / 0.68);
  font-family: var(--font-mono);
  font-size: 0.58rem;
  line-height: 1;
  white-space: nowrap;
}

.mastermind-feedback-chip i,
.mastermind-legend i {
  width: 0.65rem;
  height: 0.65rem;
  border: 1px solid rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.08);
}

.mastermind-feedback-chip[data-kind="exact"] {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.08);
}
.mastermind-feedback-chip[data-kind="exact"] i,
.mastermind-legend i[data-kind="exact"] {
  border-color: rgb(255 255 255 / 0.75);
  background: #f5f5f4;
  box-shadow: 0 0 6px rgb(255 255 255 / 0.38);
}
.mastermind-feedback-chip[data-kind="close"] {
  border-color: rgb(245 158 11 / 0.3);
  background: rgb(245 158 11 / 0.08);
}
.mastermind-feedback-chip[data-kind="close"] i,
.mastermind-legend i[data-kind="close"] {
  border-color: #fdba74;
  background: #f59e0b;
  box-shadow: 0 0 6px rgb(245 158 11 / 0.4);
}
.mastermind-legend i[data-kind="miss"] {
  border-color: rgb(255 255 255 / 0.3);
  background: rgb(255 255 255 / 0.1);
}

.mastermind-no-feedback {
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.58rem;
  white-space: nowrap;
}

.mastermind-no-feedback {
  color: rgb(255 255 255 / 0.38);
}

.mastermind-controls {
  display: grid;
  align-content: start;
  gap: 0.8rem;
  min-width: 0;
}
.mastermind-control-label {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.8rem;
  font-weight: 600;
}
.mastermind-guess-slots,
.mastermind-palette {
  display: grid;
  min-width: 0;
  gap: 0.5rem;
}
.mastermind-guess-slots {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.mastermind-palette {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.mastermind-slot,
.mastermind-palette-button {
  display: grid;
  place-items: center;
  min-width: 0;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 0.7rem;
  background: rgb(0 0 0 / 0.18);
  color: rgb(255 255 255 / 0.66);
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;
}

.mastermind-slot {
  aspect-ratio: 1;
  padding: 0.4rem;
}
.mastermind-slot:hover,
.mastermind-palette-button:hover {
  border-color: rgb(255 255 255 / 0.35);
  background: rgb(255 255 255 / 0.08);
}
.mastermind-slot:focus-visible,
.mastermind-palette-button:focus-visible {
  outline: 2px solid var(--mastermind-accent);
  outline-offset: 2px;
}
.mastermind-slot:active,
.mastermind-palette-button:active {
  transform: translateY(1px);
}
.mastermind-slot--selected {
  border-color: var(--mastermind-accent);
  background: rgb(251 146 60 / 0.12);
  box-shadow: 0 0 0 2px rgb(251 146 60 / 0.2);
}
.mastermind-slot-plus {
  color: rgb(255 255 255 / 0.3);
  font-size: 1.4rem;
}

.mastermind-palette-button {
  min-height: 4.2rem;
  gap: 0.25rem;
  padding: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
}
.mastermind-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.mastermind-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1rem;
  color: rgb(255 255 255 / 0.58);
  font-size: 0.68rem;
}
.mastermind-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.mastermind-hint {
  margin: 0;
  color: rgb(255 255 255 / 0.4);
  font-size: 0.68rem;
}

.mastermind-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.mastermind-result {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.7rem;
  padding: 1.5rem;
  border-radius: inherit;
  background: rgb(7 9 14 / 0.82);
  text-align: center;
  backdrop-filter: blur(12px);
}

.mastermind-revealed-code {
  display: flex;
  gap: 0.55rem;
  margin: 0.25rem 0;
}

@container (min-width: 48rem) {
  .mastermind-game {
    min-height: 36rem;
  }
  .mastermind-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }
  .mastermind-intro {
    display: block;
  }
  .mastermind-console-body {
    grid-template-columns: minmax(0, 1.05fr) minmax(15rem, 0.85fr);
    gap: 1.2rem 1.4rem;
    padding: 1.4rem;
  }
  .mastermind-console-header {
    grid-column: 1 / -1;
  }
  .mastermind-history {
    grid-column: 1;
    min-width: 0;
  }
  .mastermind-controls {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    padding-left: 1.4rem;
    border-left: 1px solid rgb(255 255 255 / 0.13);
  }
}

@container (min-width: 72rem) {
  .mastermind-layout {
    gap: 3rem;
    padding: 2.5rem;
  }
  .mastermind-console-body {
    gap: 1.4rem 1.8rem;
    padding: 1.7rem;
  }
  .mastermind-console {
    border-radius: 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mastermind-history-row,
  .mastermind-slot,
  .mastermind-palette-button {
    animation: none;
    transition: none;
  }
}

@keyframes mastermind-row-in {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
