<script setup lang="ts">
const input = ref("");
const output = computed(() =>
  input.value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim(),
);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Remove comments and unnecessary whitespace from SVG markup."
    ><div class="grid gap-5 lg:grid-cols-2">
      <UTextarea
        v-model="input"
        :rows="16"
        placeholder="Paste SVG markup…"
      /><UTextarea
        :model-value="output"
        :rows="16"
        readonly
      />
      <div class="flex justify-end lg:col-span-2">
        <UButton
          label="Copy SVG"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div></div
  ></ToolWorkbench>
</template>
