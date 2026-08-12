<script setup lang="ts">
import { formatScript } from "~/utils/browser-tools";
const input = ref("");
const mode = ref<"format" | "minify">("format");
const output = computed(() => formatScript(input.value, mode.value === "minify"));
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Clean up or compact small JavaScript snippets locally."
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
          placeholder="Paste JavaScript…"
        /><UTextarea
          :model-value="output"
          :rows="16"
          readonly
          placeholder="Formatted JavaScript appears here."
        />
      </div>
      <div class="flex justify-end">
        <UButton
          label="Copy JavaScript"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div></div
  ></ToolWorkbench>
</template>
