<script setup lang="ts">
import type { PhaserGameFactory, PhaserGameState } from "~/core/phaser/types";
import { PHASER_GAME_ASPECT } from "~/core/phaser/constants";

const props = withDefaults(
  defineProps<{
    create: PhaserGameFactory;
    label?: string;
    loadingTitle?: string;
    loadingCopy?: string;
    loadingBackground?: string;
  }>(),
  {
    label: "Interactive game",
    loadingTitle: "LOADING GAME",
    loadingCopy: "Preparing your next round…",
  },
);

const emit = defineEmits<{
  state: [state: PhaserGameState];
  error: [error: unknown];
  ready: [];
}>();

const hostStyle = computed(() => ({
  "--phaser-game-aspect": PHASER_GAME_ASPECT,
  ...(props.loadingBackground
    ? { "--phaser-game-loading-bg": props.loadingBackground }
    : {}),
}));

const mount = ref<HTMLElement | null>(null);
const loading = ref(true);
const isFullscreen = ref(false);
const isMuted = ref(false);
const fullscreenTarget = ref<HTMLElement | null>(null);
let game: Awaited<ReturnType<PhaserGameFactory>> | undefined;
let disposed = false;

function start(option?: unknown) {
  game?.startGame?.(option);
}

function restart(option?: unknown) {
  game?.restartGame?.(option);
}

function toggleMute() {
  const next = game?.toggleMute?.();
  isMuted.value = typeof next === "boolean" ? next : !isMuted.value;
}

function getFullscreenTarget() {
  return mount.value?.closest<HTMLElement>("[data-phaser-game-shell]") ?? mount.value;
}

function syncFullscreen() {
  const target = fullscreenTarget.value ?? getFullscreenTarget();
  fullscreenTarget.value = target;
  isFullscreen.value = document.fullscreenElement === target;
}

async function toggleFullscreen() {
  const target = fullscreenTarget.value ?? getFullscreenTarget();
  if (!target) return;

  try {
    if (document.fullscreenElement === target) await document.exitFullscreen();
    else await target.requestFullscreen();
  } catch {
    // Fullscreen can be denied by browser policy; game remains playable inline.
  }
}

defineExpose({ isFullscreen, isMuted, restart, start, toggleFullscreen, toggleMute });

onMounted(async () => {
  if (!mount.value) return;

  fullscreenTarget.value = getFullscreenTarget();
  document.addEventListener("fullscreenchange", syncFullscreen);
  syncFullscreen();

  try {
    // Load both weights before Phaser rasterizes any canvas text. This keeps
    // the first frame from swapping from a fallback into the scalable UI font.
    await Promise.all([
      document.fonts.load('400 16px "Manrope"'),
      document.fonts.load('700 16px "Manrope"'),
    ]);
    game = await props.create(
      mount.value,
      (state) => emit("state", state),
      () => {
        if (!disposed) {
          loading.value = false;
          emit("ready");
        }
      },
      (error) => {
        if (!disposed) {
          loading.value = false;
          emit("error", error);
        }
      },
    );
    if (disposed) game.destroy(true);
  } catch (error) {
    loading.value = false;
    emit("error", error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  document.removeEventListener("fullscreenchange", syncFullscreen);
  game?.destroy(true);
});
</script>

<template>
  <div
    ref="mount"
    class="phaser-game-host"
    :class="{ 'is-loading': loading }"
    :style="hostStyle"
    :aria-label="props.label"
    :aria-busy="loading"
    role="application"
  >
    <div
      v-if="loading"
      class="phaser-game-loading"
      role="status"
      aria-live="polite"
    >
      <div
        class="phaser-game-loading__sun"
        aria-hidden="true"
      />
      <div
        class="phaser-game-loading__mark"
        aria-hidden="true"
      >
        ✦
      </div>
      <div class="phaser-game-loading__button">
        <NuxtImg
          src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_flat.png"
          alt=""
          aria-hidden="true"
          width="208"
          height="64"
        />
        <span>{{ props.loadingTitle }}</span>
      </div>
      <span class="phaser-game-loading__copy">{{ props.loadingCopy }}</span>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.phaser-game-host {
  position: relative;
  display: grid;
  width: 100%;
  max-width: none;
  aspect-ratio: var(--phaser-game-aspect);
  margin-inline: auto;
  overflow: hidden;
  border: 1px solid var(--phaser-game-loading-bg, #17324c);
  background: var(--phaser-game-loading-bg, #17324c);
  box-shadow: 0 18px 50px rgb(23 50 76 / 18%);
  contain: layout paint;
  touch-action: none;
}

.phaser-game-loading {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.8rem;
  overflow: hidden;
  padding: 1rem;
  background: var(--phaser-game-loading-bg, #17324c);
  color: var(--phaser-game-loading-fg, #fff);
  font-family: var(--font-sans), system-ui, sans-serif;
}

.phaser-game-loading__sun {
  position: absolute;
  top: 7rem;
  right: -4rem;
  width: 13rem;
  height: 13rem;
  border-radius: 999px;
  background: #f4bd68;
  opacity: 0.35;
}

.phaser-game-loading__mark {
  position: relative;
  color: #f4bd68;
  font-size: 2.4rem;
  animation: loading-float 1.6s ease-in-out infinite;
}

.phaser-game-loading__button {
  position: relative;
  display: grid;
  width: 208px;
  height: 64px;
  place-items: center;
  color: #fff;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
}

.phaser-game-loading__button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.phaser-game-loading__button span {
  position: relative;
  z-index: 1;
}

.phaser-game-loading__copy {
  position: relative;
  color: color-mix(in srgb, var(--phaser-game-loading-fg, #fff) 76%, transparent);
  font-size: 0.7rem;
}

.phaser-game-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: auto !important;
  margin: auto;
  background: var(--phaser-game-loading-bg, #17324c);
  image-rendering: auto;
  touch-action: none;
}

.phaser-game-host.is-loading :deep(canvas) {
  visibility: hidden;
}

.phaser-game-host:fullscreen {
  width: 100vw;
  height: 100dvh;
  min-height: 0;
  max-width: none;
  border: 0;
  border-radius: 0;
  background: var(--phaser-game-loading-bg, #111820);
  box-shadow: none;
  place-items: center;
}

.phaser-game-host:fullscreen :deep(canvas) {
  width: min(100vw, calc(100dvh * var(--phaser-game-aspect))) !important;
  height: min(100dvh, calc(100vw / var(--phaser-game-aspect))) !important;
  max-width: 100vw;
  max-height: 100dvh;
  image-rendering: auto;
}

:global([data-phaser-game-shell]:fullscreen) {
  position: relative !important;
  inset: 0 !important;
  display: grid !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-height: 0 !important;
  max-width: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: var(--phaser-game-loading-bg, #111820) !important;
  box-shadow: none !important;
  place-items: center !important;
}

:global([data-phaser-game-shell]:fullscreen > .phaser-game-host) {
  width: min(100vw, calc(100dvh * var(--phaser-game-aspect))) !important;
  height: min(100dvh, calc(100vw / var(--phaser-game-aspect))) !important;
  min-height: 0 !important;
  max-width: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

:global([data-phaser-game-shell]:fullscreen .phaser-game-host canvas) {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  image-rendering: auto !important;
}

@keyframes loading-float {
  50% {
    transform: translateY(-0.4rem) rotate(8deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .phaser-game-loading__mark {
    animation: none;
  }
}
</style>
