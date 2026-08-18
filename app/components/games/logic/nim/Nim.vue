<script setup lang="ts">
type GameMode = "computer" | "local";
type GamePhase = "loading" | "ready" | "playing" | "complete";
type Player = 1 | 2;

interface Move {
  amount: number;
  pile: number;
  player: Player;
}

const modeOptions = [
  { label: "Against computer", value: "computer", description: "A local optimal opponent" },
  { label: "Two players", value: "local", description: "Share the screen" },
];
const startingPiles = [3, 4, 5];

const phase = ref<GamePhase>("loading");
const mode = ref<GameMode>("computer");
const piles = ref<number[]>([...startingPiles]);
const turn = ref<Player>(1);
const winner = ref<Player | null>(null);
const moves = ref<Move[]>([]);
const computerThinking = ref(false);
const loadingProgress = ref(12);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;
let computerTimer: ReturnType<typeof setTimeout> | undefined;

const totalStones = computed(() => piles.value.reduce((sum, pile) => sum + pile, 0));
const isComplete = computed(() => phase.value === "complete");
const isHumanTurn = computed(() => mode.value === "local" || turn.value === 1);
const lastMove = computed(() => moves.value.at(-1));
const winnerLabel = computed(() => {
  if (!winner.value) return "";
  if (mode.value === "computer") return winner.value === 1 ? "You win" : "Computer wins";
  return `Player ${winner.value} wins`;
});
const statusText = computed(() => {
  if (phase.value === "loading") return "Preparing the stone table";
  if (phase.value === "ready") return "Take stones from one pile";
  if (isComplete.value) return winnerLabel.value;
  if (computerThinking.value) return "Computer is thinking";
  return mode.value === "computer"
    ? "Your turn · take from one pile"
    : `Player ${turn.value} · take from one pile`;
});

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function clearComputerTimer() {
  if (computerTimer) clearTimeout(computerTimer);
  computerTimer = undefined;
  computerThinking.value = false;
}

function begin() {
  clearComputerTimer();
  piles.value = [...startingPiles];
  turn.value = 1;
  winner.value = null;
  moves.value = [];
  phase.value = "playing";
}

function optimalComputerMove() {
  const nimSum = piles.value.reduce((sum, pile) => sum ^ pile, 0);
  if (nimSum !== 0) {
    for (const [index, pile] of piles.value.entries()) {
      const target = pile ^ nimSum;
      if (target < pile) return { amount: pile - target, pile: index };
    }
  }

  const pile = piles.value.findIndex((value) => value > 0);
  return { amount: 1, pile: Math.max(0, pile) };
}

function applyMove(pileIndex: number, amount: number, player: Player) {
  if (phase.value !== "playing") return;
  const pile = piles.value[pileIndex];
  if (pile === undefined || amount < 1 || amount > pile) return;

  const nextPiles = [...piles.value];
  nextPiles[pileIndex] = pile - amount;
  piles.value = nextPiles;
  moves.value = [...moves.value, { amount, pile: pileIndex, player }];

  if (nextPiles.every((value) => value === 0)) {
    winner.value = player;
    phase.value = "complete";
    clearComputerTimer();
    return;
  }

  turn.value = player === 1 ? 2 : 1;
  if (mode.value === "computer" && turn.value === 2) scheduleComputerMove();
}

function scheduleComputerMove() {
  computerThinking.value = true;
  computerTimer = setTimeout(() => {
    computerThinking.value = false;
    const move = optimalComputerMove();
    applyMove(move.pile, move.amount, 2);
  }, 720);
}

function take(pileIndex: number, amount: number) {
  if (phase.value !== "playing" || !isHumanTurn.value || computerThinking.value) return;
  applyMove(pileIndex, amount, mode.value === "computer" ? 1 : turn.value);
}

onMounted(() => {
  loadingTimer = setTimeout(finishLoading, 700);
});

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
  clearComputerTimer();
});
</script>

<template>
  <ToolWorkbench
    description="Take one or more stones from one pile. Whoever takes the last stone wins."
  >
    <div class="nim-game">
      <img
        src="/game-arts/nim.jpg"
        alt="A strategic stone-taking game on a warm wooden table"
        class="nim-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="nim-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="nim-state"
      >
        <div class="nim-state-copy">
          <UIcon
            name="i-tabler-stack-2"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="nim-eyebrow">Stone table</p>
          <h2>Setting the piles</h2>
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
        class="nim-state nim-state--ready"
      >
        <div class="nim-ready-copy">
          <UBadge
            label="Classic 3–4–5 table"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="nim-eyebrow">Count · plan · take</p>
          <h2>Take the last stone.<br />Take the win.</h2>
          <p>Take any number from one pile. A good move leaves your opponent the wrong choices.</p>
          <UFormField
            label="Play mode"
            class="nim-ready-field"
          >
            <USelect
              v-model="mode"
              :items="modeOptions"
              value-key="value"
              label-key="label"
              size="lg"
              class="w-full sm:w-72"
            />
          </UFormField>
          <UButton
            label="Start match"
            icon="i-tabler-player-play"
            color="primary"
            size="lg"
            @click="begin"
          />
        </div>
      </div>

      <div
        v-else
        class="nim-layout"
      >
        <aside class="nim-intro">
          <p class="nim-eyebrow">Impartial strategy</p>
          <h2>Every stone<br />changes the odds.</h2>
          <p>
            Leave a balanced position for yourself. The computer knows the same math, so every move
            matters.
          </p>
        </aside>

        <section
          class="nim-console"
          :class="{ 'nim-console--done': isComplete }"
          aria-label="Nim game"
        >
          <div
            class="nim-console-body"
            :class="{ 'nim-console-body--blurred': isComplete }"
          >
            <header class="nim-header">
              <div>
                <p class="nim-eyebrow">
                  Nim · {{ mode === "computer" ? "solo table" : "local table" }}
                </p>
                <p
                  class="nim-status"
                  :data-thinking="computerThinking"
                  role="status"
                  aria-live="polite"
                >
                  {{ statusText }}
                </p>
              </div>
              <div class="nim-count">
                <span>Stones left</span>
                <strong>{{ totalStones }}</strong>
              </div>
            </header>

            <div class="nim-board">
              <section
                v-for="(pile, pileIndex) in piles"
                :key="pileIndex"
                class="nim-pile"
                :data-empty="pile === 0"
                :aria-label="`Pile ${pileIndex + 1}, ${pile} stones`"
              >
                <div class="nim-pile-header">
                  <span>Pile {{ pileIndex + 1 }}</span>
                  <strong>{{ pile }}</strong>
                </div>
                <div class="nim-stones">
                  <span
                    v-for="stone in pile"
                    :key="stone"
                    class="nim-stone"
                    aria-hidden="true"
                  />
                  <span
                    v-if="pile === 0"
                    class="nim-empty"
                    aria-hidden="true"
                    >Empty</span
                  >
                </div>
                <div class="nim-pile-actions">
                  <UButton
                    v-for="amount in pile"
                    :key="amount"
                    :label="`Take ${amount}`"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="!isHumanTurn || computerThinking || isComplete"
                    @click="take(pileIndex, amount)"
                  />
                </div>
              </section>
            </div>

            <div
              class="nim-last-move"
              :class="{ 'nim-last-move--empty': !lastMove }"
              role="status"
              aria-live="polite"
            >
              <template v-if="lastMove">
                <UIcon
                  name="i-tabler-arrow-down-right"
                  aria-hidden="true"
                />
                <span>
                  {{
                    mode === "computer" && lastMove.player === 2
                      ? "Computer"
                      : `Player ${lastMove.player}`
                  }}
                  took <strong>{{ lastMove.amount }}</strong> from pile {{ lastMove.pile + 1 }}.
                </span>
              </template>
            </div>

            <div class="nim-footer">
              <p>Take any number from one pile. Last stone wins.</p>
              <UButton
                label="New match"
                icon="i-tabler-refresh"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="begin"
              />
            </div>
          </div>

          <div
            v-if="isComplete"
            class="nim-result"
          >
            <UIcon
              :name="winner === 1 ? 'i-tabler-trophy' : 'i-tabler-flag-3'"
              :class="winner === 1 ? 'text-success' : 'text-primary'"
              class="size-9"
              aria-hidden="true"
            />
            <p class="nim-eyebrow">Match complete</p>
            <h2>{{ winnerLabel }}.</h2>
            <p>All stones are gone. The final move decided it.</p>
            <UButton
              label="Play again"
              icon="i-tabler-player-play"
              color="primary"
              @click="begin"
            />
          </div>
        </section>
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.nim-game {
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  min-height: 42rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 1.25rem;
  background: #0b0d12;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.28);
}

.nim-art,
.nim-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.nim-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.nim-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.3) 46%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.22);
}

.nim-state,
.nim-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.nim-state {
  display: grid;
  place-items: center;
  color: white;
  text-align: center;
}

.nim-state-copy,
.nim-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.nim-state-copy h2,
.nim-ready-copy h2,
.nim-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.nim-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.nim-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.nim-ready-copy > p:not(.nim-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.nim-ready-field {
  width: 100%;
  color: white;
}

.nim-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.nim-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.nim-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.nim-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.nim-console {
  position: relative;
  min-width: 0;
  align-self: center;
  border: 1px solid rgb(254 243 199 / 0.25);
  border-radius: 1rem;
  background: rgb(0 0 0 / 0.75);
  color: white;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(4px);
}

.nim-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.nim-header,
.nim-pile-header,
.nim-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.nim-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.nim-status[data-thinking="true"] {
  color: #fdba74;
}

.nim-count {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 0.3rem 0.55rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.55);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.nim-count strong {
  grid-row: span 2;
  color: white;
  font-size: 1.25rem;
}

.nim-board {
  display: grid;
  gap: 0.6rem;
}

.nim-pile {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 0.055);
}

.nim-pile[data-empty="true"] {
  opacity: 0.62;
}

.nim-pile-header {
  align-items: center;
  color: rgb(255 255 255 / 0.55);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
}

.nim-pile-header strong {
  color: #fdba74;
  font-size: 1.1rem;
}

.nim-stones {
  display: flex;
  min-height: 3.25rem;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.4rem;
}

.nim-stone {
  display: block;
  width: 1.8rem;
  height: 1.8rem;
  border: 2px solid rgb(255 220 157 / 0.72);
  border-radius: 9999px;
  background: radial-gradient(circle at 30% 24%, #ffe8a8, #d98a24 52%, #6e2e0b);
  box-shadow:
    inset 0 2px 3px rgb(255 255 255 / 0.45),
    inset 0 -4px 6px rgb(58 18 3 / 0.35),
    0 3px 5px rgb(0 0 0 / 0.32);
  animation: stone-in 260ms ease-out;
}

.nim-empty {
  color: rgb(255 255 255 / 0.3);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.nim-pile-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}

.nim-last-move {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.7rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgb(251 146 60 / 0.22);
  border-radius: 0.65rem;
  background: rgb(251 146 60 / 0.08);
  color: rgb(255 255 255 / 0.62);
  font-size: 0.7rem;
}

.nim-last-move--empty {
  visibility: hidden;
}

.nim-last-move .iconify {
  color: #fdba74;
}

.nim-last-move strong {
  color: white;
  font-family: var(--font-mono);
}

.nim-footer {
  align-items: center;
  padding-top: 0.2rem;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.nim-footer p {
  margin: 0;
  color: rgb(255 255 255 / 0.42);
  font-size: 0.65rem;
  line-height: 1.5;
}

.nim-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.nim-result {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.7rem;
  padding: 1.5rem;
  border-radius: inherit;
  background: rgb(0 0 0 / 0.65);
  color: white;
  text-align: center;
  backdrop-filter: blur(8px);
}

.nim-result p:not(.nim-eyebrow) {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
}

@keyframes stone-in {
  from {
    opacity: 0;
    transform: scale(0.65) translateY(0.4rem);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@container (min-width: 48rem) {
  .nim-game {
    min-height: 36rem;
  }

  .nim-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }

  .nim-intro {
    display: block;
  }

  .nim-console-body {
    gap: 1.2rem;
    padding: 1.4rem;
  }

  .nim-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@container (min-width: 72rem) {
  .nim-layout {
    gap: 3rem;
    padding: 2.5rem;
  }

  .nim-console-body {
    padding: 1.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nim-stone {
    animation: none;
  }
}
</style>
