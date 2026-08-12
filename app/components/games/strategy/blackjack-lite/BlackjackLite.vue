<script setup lang="ts">
interface Card {
  rank: string;
  value: number;
}
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const deck = ref<Card[]>([]);
const player = ref<Card[]>([]);
const dealer = ref<Card[]>([]);
const finished = ref(false);
const result = ref("");
const playerScore = computed(() => score(player.value));
const dealerScore = computed(() => score(dealer.value));
const statusText = computed(() => result.value || `Your score ${playerScore.value}. Hit or stand.`);
function freshDeck() {
  return Array.from({ length: 20 }, (_, index) => {
    const rank = ranks[index % ranks.length]!;
    return { rank, value: Math.min((index % 13) + 1, 10) };
  }).sort(() => Math.random() - 0.5);
}
function score(cards: Card[]) {
  return cards.reduce((sum, card) => sum + card.value, 0);
}
function draw() {
  return deck.value.pop()!;
}
function start() {
  deck.value = freshDeck();
  player.value = [draw(), draw()];
  dealer.value = [draw(), draw()];
  finished.value = false;
  result.value = "";
  if (playerScore.value === 21) stand();
}
function hit() {
  if (finished.value) return;
  player.value = [...player.value, draw()];
  if (playerScore.value > 21) {
    finished.value = true;
    result.value = "Bust. Dealer wins.";
  }
}
function stand() {
  if (finished.value) return;
  while (dealerScore.value < 17) dealer.value = [...dealer.value, draw()];
  finished.value = true;
  result.value =
    dealerScore.value > 21 || playerScore.value > dealerScore.value
      ? "You win."
      : playerScore.value === dealerScore.value
        ? "Push."
        : "Dealer wins.";
}
onMounted(start);
</script>

<template>
  <ToolWorkbench
    description="Reach 21 without going over. Dealer stands on 17. No betting, no account."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <p
        class="text-toned text-center"
        :class="finished ? (result === 'You win.' ? 'text-success' : 'text-error') : ''"
        role="status"
        aria-live="polite"
      >
        {{ statusText }}
      </p>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="border-default/70 grid gap-3 border p-5">
          <span class="text-muted text-xs uppercase"
            >Dealer · {{ finished ? dealerScore : "?" }}</span
          >
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(card, index) in dealer"
              :key="index"
              class="blackjack-card border-primary bg-primary/10 grid size-14 place-items-center border font-mono text-lg"
              >{{ index === 1 && !finished ? "?" : card.rank }}</span
            >
          </div>
        </div>
        <div class="border-default/70 grid gap-3 border p-5">
          <span class="text-muted text-xs uppercase">You · {{ playerScore }}</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(card, index) in player"
              :key="index"
              class="blackjack-card border-success bg-success/10 grid size-14 place-items-center border font-mono text-lg"
              >{{ card.rank }}</span
            >
          </div>
        </div>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          label="Hit"
          icon="i-tabler-plus"
          size="lg"
          :disabled="finished"
          @click="hit"
        /><UButton
          label="Stand"
          color="neutral"
          variant="outline"
          size="lg"
          :disabled="finished"
          @click="stand"
        /><UButton
          label="New hand"
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          @click="start"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.blackjack-card {
  animation: card-deal 260ms ease-out both;
}
@keyframes card-deal {
  from {
    opacity: 0;
    transform: translateY(-10px) rotate(-3deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .blackjack-card {
    animation: none;
  }
}
</style>
