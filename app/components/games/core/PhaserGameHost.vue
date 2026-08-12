<script setup lang="ts">
import type { PhaserGameFactory, PhaserGameState } from "~/core/phaser/types";

const props = withDefaults(
  defineProps<{
    create: PhaserGameFactory;
    label?: string;
  }>(),
  { label: "Interactive game" },
);

const emit = defineEmits<{
  state: [state: PhaserGameState];
  error: [error: unknown];
  ready: [];
}>();

const mount = ref<HTMLElement | null>(null);
const loading = ref(true);
let game: Awaited<ReturnType<PhaserGameFactory>> | undefined;
let disposed = false;

function start() {
  game?.startGame?.();
}

function restart() {
  game?.restartGame?.();
}

defineExpose({ restart, start });

onMounted(async () => {
  if (!mount.value) return;

  try {
    await document.fonts.load('16px "Kenney Future"');
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
  game?.destroy(true);
});
</script>

<template>
  <div
    ref="mount"
    class="phaser-game-host"
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
      <div class="phaser-game-loading__sun" aria-hidden="true" />
      <div class="phaser-game-loading__mark" aria-hidden="true">✦</div>
      <div class="phaser-game-loading__button">
        <NuxtImg
          src="/game-assets/kenney/ui/PNG/Green/Default/button_rectangle_depth_flat.png"
          alt=""
          aria-hidden="true"
          width="208"
          height="64"
        />
        <span>LOADING SKY</span>
      </div>
      <span class="phaser-game-loading__copy">Warming up your wings…</span>
    </div>
  </div>
</template>

<style scoped>
.phaser-game-host {
  position: relative;
  display: grid;
  width: min(100%, 26.25rem);
  min-height: 40rem;
  margin-inline: auto;
  overflow: hidden;
  border: 1px solid #17324c;
  background: #b9e6f3;
  box-shadow: 0 18px 50px rgb(23 50 76 / 18%);
  contain: layout paint;
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
  background: #17324c;
  color: #fff;
  font-family: "Kenney Future", var(--font-mono), monospace;
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
  color: rgb(255 255 255 / 76%);
  font-size: 0.7rem;
}

.phaser-game-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: auto !important;
  margin: auto;
  background: #b9e6f3;
  image-rendering: pixelated;
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
