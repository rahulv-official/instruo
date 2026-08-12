<script setup lang="ts">
import { formatMarkup } from "~/utils/browser-tools";
const input = ref("");
const mode = ref<"format" | "minify">("format");
const output = computed(() => formatMarkup(input.value, mode.value === "minify"));
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench
    description="Format readable HTML or remove unnecessary whitespace before shipping it."
    ><div class="grid gap-5">
      <USelect
        v-model="mode"
        :items="['format', 'minify']"
        class="w-full sm:max-w-xs"
      />
      <div class="grid gap-5 lg:grid-cols-2">
        <UTextarea
          v-model="input"
          :rows="16"
          placeholder="Paste HTML…"
        /><UTextarea
          :model-value="output"
          :rows="16"
          readonly
          placeholder="Formatted HTML appears here."
        />
      </div>
      <div class="flex justify-end">
        <UButton
          label="Copy HTML"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div></div
  ></ToolWorkbench>
</template>
