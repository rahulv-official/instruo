<script setup lang="ts">
import type { BlackjackGameState } from "./createBlackjackGame";
import type PhaserGameHost from "~/components/games/core/PhaserGameHost.vue";
import { createBlackjackGame } from "./createBlackjackGame";

const gameHost = useTemplateRef<typeof PhaserGameHost>("gameHost");
const loaded = ref(false);
const gameError = ref(false);
const state = shallowRef<BlackjackGameState>({
  status: "ready",
  dealing: false,
  playerScore: 0,
  dealerScore: -1,
  playerCards: 0,
  dealerCards: 0,
  result: "",
});

const canAct = computed(() => state.value.status === "playing" && !state.value.dealing);
const dealerScoreLabel = computed(() =>
  state.value.dealerScore < 0 ? "?" : String(state.value.dealerScore),
);
const playerScoreLabel = computed(() =>
  state.value.playerScore ? String(state.value.playerScore) : "—",
);
const outcomeTone = computed(() =>
  state.value.result === "You win." || state.value.result === "Blackjack!"
    ? "text-success"
    : "text-highlighted",
);

function updateState(next: Record<string, unknown>) {
  if (
    (next.status === "ready" || next.status === "playing" || next.status === "over") &&
    typeof next.dealing === "boolean" &&
    typeof next.playerScore === "number" &&
    typeof next.dealerScore === "number" &&
    typeof next.playerCards === "number" &&
    typeof next.dealerCards === "number" &&
    typeof next.result === "string"
  ) {
    state.value = {
      status: next.status,
      dealing: next.dealing,
      playerScore: next.playerScore,
      dealerScore: next.dealerScore,
      playerCards: next.playerCards,
      dealerCards: next.dealerCards,
      result: next.result,
    };
  }
}
</script>

<template>
  <ToolWorkbench
    description="Reach 21 without going over. Dealer stands on 17. Local table, no betting, no account."
  >
    <div class="mx-auto grid max-w-2xl gap-5">
      <header class="border-default/70 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p class="text-highlighted text-sm font-semibold">Blackjack</p>
          <p class="text-muted mt-1 font-mono text-xs">Felt Table · local dealer</p>
        </div>
        <div class="text-muted flex gap-3 font-mono text-xs">
          <span class="text-highlighted">Dealer {{ dealerScoreLabel }}</span>
          <span class="text-highlighted">You {{ playerScoreLabel }}</span>
        </div>
      </header>

      <div
        class="border-default relative overflow-hidden border"
        data-phaser-game-shell
        style="--phaser-game-loading-bg: #0a2d29"
        :class="{ 'is-over': loaded && state.status === 'over' }"
      >
        <PhaserGameHost
          ref="gameHost"
          :create="createBlackjackGame"
          label="Blackjack game stage"
          loading-title="LOADING FELT TABLE"
          loading-copy="Shuffling the deck and stacking chips…"
          loading-background="#0a2d29"
          :class="{ 'blur-sm': loaded && state.status === 'over' }"
          @state="updateState"
          @ready="loaded = true"
          @error="gameError = true"
        />

        <PhaserFullscreenButton
          :is-fullscreen="gameHost?.isFullscreen ?? false"
          @toggle="gameHost?.toggleFullscreen()"
        />

        <div
          v-if="loaded && state.status === 'ready'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="bg-primary text-inverted mx-auto grid size-14 place-items-center text-2xl"
              aria-hidden="true"
            >
              <Icon name="i-tabler-cards" />
            </div>
            <h2 class="text-highlighted text-xl font-semibold">Take a seat</h2>
            <p class="text-muted text-sm leading-6">
              Build a hand closer to 21 than the dealer. Aces count as 1 or 11; dealer stands on 17.
            </p>
            <button
              type="button"
              class="text-inverted focus-visible:ring-primary relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold transition-transform focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
              @click.stop="gameHost?.start()"
            >
              <NuxtImg
                src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 size-full"
                width="232"
                height="70"
              />
              <span class="relative inline-flex items-center gap-2">
                <Icon
                  name="i-tabler-player-play-filled"
                  aria-hidden="true"
                />
                Deal hand
              </span>
            </button>
            <p class="text-muted font-mono text-xs">H / Space hit · S / Enter stand</p>
          </div>
        </div>

        <div
          v-if="loaded && state.status === 'over'"
          class="bg-default/70 absolute inset-0 z-10 grid place-items-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blackjack-over-title"
        >
          <div
            class="border-default bg-elevated grid w-full max-w-sm gap-4 border p-6 text-center shadow-xl"
          >
            <div
              class="text-inverted mx-auto grid size-14 place-items-center text-2xl"
              :class="
                state.result === 'You win.' || state.result === 'Blackjack!'
                  ? 'bg-success'
                  : 'bg-primary'
              "
              aria-hidden="true"
            >
              <Icon
                :name="
                  state.result === 'You win.' || state.result === 'Blackjack!'
                    ? 'i-tabler-trophy'
                    : 'i-tabler-cards'
                "
              />
            </div>
            <h2
              id="blackjack-over-title"
              class="text-highlighted text-xl font-semibold"
            >
              {{ state.result }}
            </h2>
            <p
              class="font-mono text-4xl font-bold tabular-nums"
              :class="outcomeTone"
            >
              {{ state.playerScore }} <span class="text-muted text-xl">·</span>
              {{ state.dealerScore }}
            </p>
            <p class="text-muted font-mono text-xs tracking-[0.18em] uppercase">You · Dealer</p>
            <button
              type="button"
              class="text-inverted focus-visible:ring-primary relative mx-auto grid h-16 w-56 place-items-center text-sm font-semibold transition-transform focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
              @click.stop="gameHost?.restart()"
            >
              <NuxtImg
                src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_gloss.png"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 size-full"
                width="232"
                height="70"
              />
              <span class="relative inline-flex items-center gap-2">
                <Icon
                  name="i-tabler-refresh"
                  aria-hidden="true"
                />
                Deal again
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="gameError"
          class="bg-default absolute inset-0 z-20 grid place-items-center p-5"
          role="alert"
        >
          <UAlert
            color="error"
            variant="subtle"
            title="Game unavailable"
            description="Reload the page and try once more."
            icon="i-tabler-alert-circle"
          />
        </div>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          label="Hit"
          icon="i-tabler-plus"
          size="lg"
          :disabled="!canAct"
          @click="gameHost?.start('hit')"
        />
        <UButton
          label="Stand"
          icon="i-tabler-hand-stop"
          color="neutral"
          variant="outline"
          size="lg"
          :disabled="!canAct"
          @click="gameHost?.start('stand')"
        />
        <UButton
          label="New hand"
          icon="i-tabler-refresh"
          color="neutral"
          variant="ghost"
          :disabled="!loaded || state.status === 'playing'"
          @click="gameHost?.restart()"
        />
      </div>
      <p class="text-muted text-center font-mono text-xs">
        {{ state.playerCards }} player cards · {{ state.dealerCards }} dealer cards · no account
        needed
      </p>
    </div>
  </ToolWorkbench>
</template>
