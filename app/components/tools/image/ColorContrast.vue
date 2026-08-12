<script setup lang="ts">
import { relativeLuminance } from "~/utils/browser-tools";
const foreground = ref("#17324c");
const background = ref("#ffffff");
const ratio = computed(() => {
  const a = relativeLuminance(foreground.value);
  const b = relativeLuminance(background.value);
  return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
});
</script>
<template>
  <ToolWorkbench description="Check foreground and background contrast against WCAG text guidance."
    ><div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Foreground"><UInput v-model="foreground" /></UFormField
        ><UFormField label="Background"><UInput v-model="background" /></UFormField>
      </div>
      <div
        class="border-default grid min-h-32 place-items-center border p-5 text-lg"
        :style="{ color: foreground, backgroundColor: background }"
      >
        Readable sample text
      </div>
      <UAlert
        :color="Number(ratio) >= 4.5 ? 'success' : 'warning'"
        :title="`${ratio}:1 contrast ratio`"
        :description="
          Number(ratio) >= 7
            ? 'AAA for body text.'
            : Number(ratio) >= 4.5
              ? 'AA for body text.'
              : 'Increase contrast for body text.'
        "
      /></div
  ></ToolWorkbench>
</template>
