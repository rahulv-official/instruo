<script setup lang="ts">
import { formatMarkup } from "~/utils/browser-tools";
const input = ref("");
const output = computed(() =>
  formatMarkup(input.value)
    .split("\n")
    .map((line) =>
      line.replace(
        /^(from|run|cmd|copy|add|workdir|env|expose|entrypoint|volume|user|arg|label)\b/i,
        (value) => value.toUpperCase(),
      ),
    )
    .join("\n"),
);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Normalize common Dockerfile instruction casing and whitespace.">
    <div class="grid gap-5 lg:grid-cols-2">
      <UTextarea
        v-model="input"
        :rows="16"
        placeholder="FROM node:22\nWORKDIR /app"
      /><UTextarea
        :model-value="output"
        :rows="16"
        readonly
      />
      <div class="flex justify-end lg:col-span-2">
        <UButton
          color="neutral"
          variant="soft"
          label="Copy Dockerfile"
          icon="i-tabler-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
