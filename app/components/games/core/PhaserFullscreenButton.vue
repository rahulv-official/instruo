<script setup lang="ts">
defineProps<{
  isFullscreen: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <button
    type="button"
    class="phaser-game-fullscreen"
    :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    @pointerdown.stop
    @click.stop="emit('toggle')"
  >
    <Icon
      :name="isFullscreen ? 'i-tabler-arrows-minimize' : 'i-tabler-arrows-maximize'"
      aria-hidden="true"
    />
    <span class="sr-only">{{ isFullscreen ? "Exit fullscreen" : "Enter fullscreen" }}</span>
  </button>
</template>

<style scoped>
.phaser-game-fullscreen {
  position: absolute;
  z-index: 12;
  right: 0.75rem;
  bottom: 0.75rem;
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 26%);
  border-radius: 6px;
  background: rgb(23 50 76 / 88%);
  color: #fff;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    transform 140ms ease;
}

.phaser-game-fullscreen:hover {
  background: rgb(23 50 76 / 96%);
  transform: translateY(-1px);
}

.phaser-game-fullscreen:active {
  transform: translateY(1px);
}

.phaser-game-fullscreen:focus-visible {
  outline: 3px solid #f4bd68;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .phaser-game-fullscreen {
    transition: none;
  }
}
</style>
