<script setup lang="ts">
type Choice = "rock" | "paper" | "scissors";
type Outcome = "draw" | "lost" | "won";
type GamePhase = "loading" | "ready" | "playing" | "complete";
type ChoiceIcon = "i-tabler-circle" | "i-tabler-hand-stop" | "i-tabler-scissors";

interface ChoiceOption {
  label: string;
  value: Choice;
  icon: ChoiceIcon;
  beats: Choice;
}

interface RoundRecord {
  player: Choice;
  computer: Choice;
  outcome: Outcome;
}

const choices: ChoiceOption[] = [
  { label: "Rock", value: "rock", icon: "i-tabler-circle", beats: "scissors" },
  { label: "Paper", value: "paper", icon: "i-tabler-hand-stop", beats: "rock" },
  { label: "Scissors", value: "scissors", icon: "i-tabler-scissors", beats: "paper" },
];
const targetScore = 5;

const phase = ref<GamePhase>("loading");
const playerChoice = ref<Choice | null>(null);
const computerChoice = ref<Choice | null>(null);
const outcome = ref<Outcome | null>(null);
const playerScore = ref(0);
const computerScore = ref(0);
const rounds = ref<RoundRecord[]>([]);
const loadingProgress = ref(14);
let loadingTimer: ReturnType<typeof setTimeout> | undefined;

const isComplete = computed(() => phase.value === "complete");
const matchWinner = computed(() => {
  if (!isComplete.value) return null;
  return playerScore.value === targetScore ? "player" : "computer";
});
const status = computed(() => {
  if (isComplete.value) return matchWinner.value === "player" ? "Match won" : "Match lost";
  if (outcome.value === "won") return "You take the round";
  if (outcome.value === "lost") return "Computer takes the round";
  if (outcome.value === "draw") return "Draw — choose again";
  return "Choose your hand";
});
const statusTone = computed(() => {
  if (isComplete.value) return matchWinner.value === "player" ? "success" : "error";
  if (outcome.value === "won") return "success";
  if (outcome.value === "lost") return "error";
  return "neutral";
});
const scoreLabel = computed(() => `${playerScore.value}–${computerScore.value}`);

function optionFor(choice: Choice | null) {
  return choice ? choices.find((item) => item.value === choice) : undefined;
}

function finishLoading() {
  if (phase.value !== "loading") return;
  loadingProgress.value = 100;
  phase.value = "ready";
  if (loadingTimer) clearTimeout(loadingTimer);
}

function startGame() {
  playerChoice.value = null;
  computerChoice.value = null;
  outcome.value = null;
  playerScore.value = 0;
  computerScore.value = 0;
  rounds.value = [];
  phase.value = "playing";
}

function play(choice: Choice) {
  if (phase.value !== "playing") return;

  const computer = choices[Math.floor(Math.random() * choices.length)]!.value;
  const result: Outcome =
    choice === computer ? "draw" : optionFor(choice)?.beats === computer ? "won" : "lost";

  playerChoice.value = choice;
  computerChoice.value = computer;
  outcome.value = result;
  rounds.value = [...rounds.value, { player: choice, computer, outcome: result }].slice(-8);

  if (result === "won") playerScore.value += 1;
  if (result === "lost") computerScore.value += 1;
  if (playerScore.value === targetScore || computerScore.value === targetScore) {
    phase.value = "complete";
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
    description="Choose a hand, read the tell, and win five rounds before the computer."
  >
    <div class="rps-game">
      <img
        src="/game-arts/rock-paper-scissors.jpg"
        alt="A playful rock paper scissors match in a colorful arena"
        class="rps-art"
        draggable="false"
        @load="finishLoading"
        @error="finishLoading"
      />
      <div
        class="rps-art-wash"
        aria-hidden="true"
      />

      <div
        v-if="phase === 'loading'"
        class="rps-state"
      >
        <div class="rps-state-copy">
          <UIcon
            name="i-tabler-hand-click"
            class="text-primary size-9"
            aria-hidden="true"
          />
          <p class="rps-eyebrow">Arena prep</p>
          <h2>Shuffling the hands</h2>
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
        class="rps-state rps-state--ready"
      >
        <div class="rps-ready-copy">
          <UBadge
            label="First to five"
            color="primary"
            variant="subtle"
            class="w-fit"
          />
          <p class="rps-eyebrow">Rock · paper · scissors</p>
          <h2>Read the hand.<br />Take the match.</h2>
          <p>Rock beats scissors. Scissors beat paper. Paper beats rock.</p>
          <UButton
            label="Start match"
            icon="i-tabler-player-play"
            color="primary"
            size="lg"
            @click="startGame"
          />
        </div>
      </div>

      <div
        v-else
        class="rps-layout"
      >
        <aside class="rps-intro">
          <p class="rps-eyebrow">Roshambo arena</p>
          <h2>Simple hands.<br />Sharp reads.</h2>
          <p>
            Watch the round, pick one hand, and build a five-point lead. Draws reset the read, not
            the score.
          </p>
        </aside>

        <section
          class="rps-console"
          :class="{ 'rps-console--done': isComplete }"
          aria-label="Rock paper scissors match"
        >
          <div
            class="rps-console-body"
            :class="{ 'rps-console-body--blurred': isComplete }"
          >
            <header class="rps-header">
              <div>
                <p class="rps-eyebrow">Rock paper scissors</p>
                <p
                  class="rps-status"
                  :data-tone="statusTone"
                  role="status"
                  aria-live="polite"
                >
                  {{ status }}
                </p>
              </div>
              <div class="rps-score">
                <span>You</span>
                <strong>{{ scoreLabel }}</strong>
                <span>CPU</span>
              </div>
            </header>

            <div class="rps-round">
              <div
                class="rps-hand"
                :data-picked="Boolean(playerChoice)"
              >
                <span class="rps-hand-label">You</span>
                <UIcon
                  :name="optionFor(playerChoice)?.icon ?? 'i-tabler-help'"
                  class="rps-hand-icon"
                  aria-hidden="true"
                />
                <strong>{{ optionFor(playerChoice)?.label ?? "Choose" }}</strong>
              </div>
              <span class="rps-versus">VS</span>
              <div
                class="rps-hand"
                :data-picked="Boolean(computerChoice)"
              >
                <span class="rps-hand-label">Computer</span>
                <UIcon
                  :name="optionFor(computerChoice)?.icon ?? 'i-tabler-help'"
                  class="rps-hand-icon"
                  aria-hidden="true"
                />
                <strong>{{ optionFor(computerChoice)?.label ?? "Waiting" }}</strong>
              </div>
            </div>

            <div class="rps-choice-grid">
              <button
                v-for="choice in choices"
                :key="choice.value"
                type="button"
                class="rps-choice focus-visible:ring-primary"
                :class="{ 'rps-choice--selected': playerChoice === choice.value }"
                :disabled="isComplete"
                :aria-label="`Choose ${choice.label}`"
                @click="play(choice.value)"
              >
                <UIcon
                  :name="choice.icon"
                  class="size-7"
                  aria-hidden="true"
                />
                <span>{{ choice.label }}</span>
              </button>
            </div>

            <div
              v-if="rounds.length"
              class="rps-history"
              aria-label="Recent rounds"
            >
              <div class="rps-history-heading">
                <span>Recent rounds</span>
                <span>{{ playerScore }} wins · {{ computerScore }} losses</span>
              </div>
              <ol>
                <li
                  v-for="(round, index) in rounds"
                  :key="`${round.player}-${round.computer}-${index}`"
                  :data-outcome="round.outcome"
                >
                  <UIcon
                    :name="optionFor(round.player)?.icon ?? 'i-tabler-help'"
                    aria-hidden="true"
                  />
                  <span>{{ optionFor(round.player)?.label }}</span>
                  <span class="rps-history-vs">vs</span>
                  <UIcon
                    :name="optionFor(round.computer)?.icon ?? 'i-tabler-help'"
                    aria-hidden="true"
                  />
                  <span>{{ optionFor(round.computer)?.label }}</span>
                  <strong>{{
                    round.outcome === "won" ? "W" : round.outcome === "lost" ? "L" : "D"
                  }}</strong>
                </li>
              </ol>
            </div>

            <footer class="rps-footer">
              <p>Rock beats scissors · scissors beat paper · paper beats rock</p>
              <UButton
                label="New match"
                color="neutral"
                variant="ghost"
                icon="i-tabler-refresh"
                size="sm"
                @click="startGame"
              />
            </footer>
          </div>

          <div
            v-if="isComplete"
            class="rps-result"
          >
            <UIcon
              :name="matchWinner === 'player' ? 'i-tabler-trophy' : 'i-tabler-flag-3'"
              class="text-primary size-9"
              aria-hidden="true"
            />
            <p class="rps-eyebrow">Match complete</p>
            <h2>{{ matchWinner === "player" ? "You called it." : "Computer takes it." }}</h2>
            <p>
              Final score <strong>{{ scoreLabel }}</strong>
            </p>
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
  </ToolWorkbench>
</template>

<style scoped>
.rps-game {
  --rps-accent: #fb923c;
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

.rps-art,
.rps-art-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rps-art {
  z-index: -2;
  object-fit: cover;
  object-position: center;
  user-select: none;
}

.rps-art-wash {
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.3) 46%, rgb(0 0 0 / 0.9)),
    rgb(0 0 0 / 0.22);
}

.rps-state,
.rps-layout {
  position: relative;
  z-index: 1;
  min-height: inherit;
  padding: 1rem;
}

.rps-state {
  display: grid;
  place-items: center;
  color: white;
  text-align: center;
}

.rps-state-copy,
.rps-ready-copy {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 34rem;
  padding: 1rem;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.65);
}

.rps-state-copy h2,
.rps-ready-copy h2,
.rps-result h2 {
  margin: 0;
  color: white;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
}

.rps-eyebrow {
  margin: 0;
  color: rgb(255 255 255 / 0.58);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.rps-ready-copy {
  justify-items: start;
  align-self: end;
  margin-right: auto;
  text-align: left;
}

.rps-ready-copy > p:not(.rps-eyebrow) {
  margin: 0;
  max-width: 30rem;
  color: rgb(255 255 255 / 0.72);
  line-height: 1.6;
}

.rps-layout {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.rps-intro {
  display: none;
  align-self: end;
  max-width: 20rem;
  padding: 1rem 0 1.5rem;
  color: white;
}

.rps-intro h2 {
  margin: 0.7rem 0 1rem;
  color: white;
  font-size: clamp(2rem, 4cqw, 4.5rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.rps-intro > p:last-child {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-size: 0.9rem;
  line-height: 1.65;
}

.rps-console {
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

.rps-console-body {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.rps-header,
.rps-history-heading,
.rps-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.rps-status {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 1.2rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.rps-status[data-tone="success"] {
  color: #86efac;
}

.rps-status[data-tone="error"] {
  color: #fca5a5;
}

.rps-score {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.08);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: rgb(255 255 255 / 0.55);
}

.rps-score strong {
  color: white;
  font-size: 1.05rem;
  letter-spacing: -0.08em;
}

.rps-round {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  gap: 0.5rem;
}

.rps-hand {
  display: grid;
  min-width: 0;
  min-height: 9rem;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.11);
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 0.055);
  text-align: center;
}

.rps-hand[data-picked="true"] {
  border-color: rgb(251 146 60 / 0.42);
  background: rgb(251 146 60 / 0.1);
}

.rps-hand-label {
  color: rgb(255 255 255 / 0.5);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.rps-hand-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgb(255 255 255 / 0.35);
}

.rps-hand[data-picked="true"] .rps-hand-icon {
  color: #fdba74;
}

.rps-hand strong {
  color: rgb(255 255 255 / 0.88);
  font-size: 0.9rem;
}

.rps-versus {
  display: grid;
  place-items: center;
  color: rgb(255 255 255 / 0.35);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.rps-choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.rps-choice {
  display: grid;
  min-height: 5.5rem;
  place-items: center;
  align-content: center;
  gap: 0.4rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.065);
  color: rgb(255 255 255 / 0.76);
  font-size: 0.75rem;
  font-weight: 600;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.rps-choice:hover:not(:disabled) {
  border-color: rgb(251 146 60 / 0.45);
  background: rgb(251 146 60 / 0.12);
  color: white;
}

.rps-choice:active:not(:disabled) {
  transform: translateY(1px);
}

.rps-choice--selected {
  border-color: rgb(251 146 60 / 0.75);
  background: rgb(251 146 60 / 0.16);
  color: #fdba74;
}

.rps-choice:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.rps-history {
  display: grid;
  gap: 0.55rem;
}

.rps-history-heading {
  color: rgb(255 255 255 / 0.5);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.rps-history ol {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rps-history li {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.42rem 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.55rem;
  color: rgb(255 255 255 / 0.58);
  font-size: 0.64rem;
}

.rps-history li[data-outcome="won"] {
  border-color: rgb(134 239 172 / 0.3);
  color: #86efac;
}

.rps-history li[data-outcome="lost"] {
  border-color: rgb(252 165 165 / 0.3);
  color: #fca5a5;
}

.rps-history-vs {
  margin-inline: auto;
  color: rgb(255 255 255 / 0.3);
}

.rps-history li strong {
  margin-left: 0.25rem;
  font-family: var(--font-mono);
}

.rps-footer {
  align-items: center;
  padding-top: 0.2rem;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.rps-footer p {
  margin: 0;
  color: rgb(255 255 255 / 0.42);
  font-size: 0.65rem;
  line-height: 1.5;
}

.rps-console-body--blurred {
  filter: blur(3px);
  opacity: 0.56;
}

.rps-result {
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

.rps-result p:not(.rps-eyebrow) {
  margin: 0;
  color: rgb(255 255 255 / 0.72);
}

.rps-result strong {
  color: white;
  font-family: var(--font-mono);
  font-size: 1.2rem;
}

@container (min-width: 48rem) {
  .rps-game {
    min-height: 36rem;
  }

  .rps-layout {
    grid-template-columns: minmax(13rem, 0.7fr) minmax(0, 1.3fr);
    gap: 2rem;
    padding: 2rem;
  }

  .rps-intro {
    display: block;
  }

  .rps-console-body {
    gap: 1.2rem;
    padding: 1.4rem;
  }
}

@container (min-width: 72rem) {
  .rps-layout {
    gap: 3rem;
    padding: 2.5rem;
  }

  .rps-console-body {
    padding: 1.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rps-choice {
    transition: none;
  }
}
</style>
