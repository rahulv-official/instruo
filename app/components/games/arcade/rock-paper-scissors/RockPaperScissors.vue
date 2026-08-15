<script setup lang="ts">
type Choice = "rock" | "paper" | "scissors";
type Outcome = "draw" | "lost" | "won";
type ChoiceIcon = "i-tabler-circle" | "i-tabler-note" | "i-tabler-scissors";

const choices: { label: string; value: Choice; icon: ChoiceIcon }[] = [
  { label: "Rock", value: "rock", icon: "i-tabler-circle" },
  { label: "Paper", value: "paper", icon: "i-tabler-note" },
  { label: "Scissors", value: "scissors", icon: "i-tabler-scissors" },
];
const winningChoice: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};
const targetScore = 5;

const playerChoice = ref<Choice | null>(null);
const computerChoice = ref<Choice | null>(null);
const outcome = ref<Outcome | null>(null);
const playerScore = ref(0);
const computerScore = ref(0);

const isComplete = computed(
  () => playerScore.value === targetScore || computerScore.value === targetScore,
);
const status = computed(() => {
  if (isComplete.value) {
    return playerScore.value === targetScore
      ? `You win ${playerScore.value}–${computerScore.value}.`
      : `Computer wins ${computerScore.value}–${playerScore.value}.`;
  }
  if (outcome.value === "won") return "You take the round.";
  if (outcome.value === "lost") return "Computer takes the round.";
  if (outcome.value === "draw") return "Draw. Choose again.";
  return `First to ${targetScore}. Make your choice.`;
});

function labelFor(choice: Choice | null) {
  return choice ? choices.find((item) => item.value === choice)?.label : "—";
}

function play(choice: Choice) {
  if (isComplete.value) return;

  const computer = choices[Math.floor(Math.random() * choices.length)]!.value;
  playerChoice.value = choice;
  computerChoice.value = computer;

  if (choice === computer) {
    outcome.value = "draw";
  } else if (winningChoice[choice] === computer) {
    playerScore.value += 1;
    outcome.value = "won";
  } else {
    computerScore.value += 1;
    outcome.value = "lost";
  }
}

function reset() {
  playerChoice.value = null;
  computerChoice.value = null;
  outcome.value = null;
  playerScore.value = 0;
  computerScore.value = 0;
}

if (import.meta.dev && Object.values(winningChoice).length !== choices.length) {
  throw new Error("Rock Paper Scissors rules check failed");
}
</script>

<template>
  <ToolWorkbench description="Choose a hand, beat the computer, and reach five round wins first.">
    <div class="mx-auto grid max-w-xl gap-6">
      <div class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="
            outcome === 'lost' || (isComplete && computerScore > playerScore)
              ? 'text-error'
              : outcome === 'won' || (isComplete && playerScore > computerScore)
                ? 'text-success'
                : 'text-toned'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="outcome === 'lost' || (isComplete && computerScore > playerScore)"
            name="i-tabler-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="outcome === 'won' || (isComplete && playerScore > computerScore)"
            name="i-tabler-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
        </p>
        <span class="text-toned shrink-0 font-mono text-sm tabular-nums">
          {{ playerScore }}–{{ computerScore }}
        </span>
      </div>

      <div
        class="border-inverted grid grid-cols-2 border-2"
        aria-label="Round result"
      >
        <div
          class="border-default/70 grid min-h-36 place-items-center gap-2 border-r p-5 text-center"
        >
          <span class="text-muted text-xs font-semibold tracking-[0.14em] uppercase">You</span>
          <strong class="text-highlighted font-mono text-2xl">{{ labelFor(playerChoice) }}</strong>
        </div>
        <div class="grid min-h-36 place-items-center gap-2 p-5 text-center">
          <span class="text-muted text-xs font-semibold tracking-[0.14em] uppercase">Computer</span>
          <strong class="text-highlighted font-mono text-2xl">{{
            labelFor(computerChoice)
          }}</strong>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          v-for="choice in choices"
          :key="choice.value"
          type="button"
          class="focus-visible:ring-primary border-default/70 bg-default hover:bg-elevated/60 min-h-18 border px-2 font-mono text-sm font-semibold transition-[background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            playerChoice === choice.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-highlighted'
          "
          :disabled="isComplete"
          @click="play(choice.value)"
        >
          <Icon
            :name="choice.icon"
            class="mr-2 inline-block size-5 align-text-bottom"
            aria-hidden="true"
          />
          {{ choice.label }}
        </button>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
        <p class="text-muted text-sm leading-6">
          Rock beats scissors, scissors beat paper, paper beats rock.
        </p>
        <UButton
          label="New match"
          color="neutral"
          variant="outline"
          icon="i-tabler-refresh"
          @click="reset"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
