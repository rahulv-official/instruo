<script setup lang="ts">
import { hexRgb } from "~/utils/browser-tools";
const color = ref("#3b82f6");
function mix(amount: number) {
  const rgb = hexRgb(color.value);
  if (!rgb) return color.value;
  return `rgb(${rgb.map((channel) => Math.round(channel + (amount > 0 ? 255 - channel : -channel) * Math.abs(amount))).join(", ")})`;
}
const palette = computed(() => [mix(0.8), mix(0.4), color.value, mix(-0.35), mix(-0.7)]);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Create a five-step light-to-dark palette from one hex color."
    ><div class="grid gap-5">
      <UInput
        v-model="color"
        placeholder="#3b82f6"
      />
      <div class="grid grid-cols-5">
        <button
          v-for="tone in palette"
          :key="tone"
          type="button"
          class="grid min-h-32 place-items-end p-2 text-xs text-white text-shadow-sm"
          :style="{ background: tone }"
          @click="copyText(tone)"
        >
          <span>{{ tone }}</span>
        </button>
      </div>
      <UButton
        label="Copy palette"
        icon="i-lucide-copy"
        class="w-fit"
        @click="copyText(palette.join('\n'))"
      /></div
  ></ToolWorkbench>
</template>
