<script setup lang="ts">
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
const direction = ref<"json-yaml" | "yaml-json">("json-yaml");
const input = ref("");
const output = computed(() => {
  try {
    if (!input.value.trim()) return "";
    if (direction.value === "json-yaml") {
      return stringifyYaml(JSON.parse(input.value), { indent: 2 });
    }
    return JSON.stringify(parseYaml(input.value), null, 2);
  } catch (error) {
    return error instanceof Error ? `Error: ${error.message}` : "Could not parse input.";
  }
});
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Convert JSON and simple YAML locally, with no upload.">
    <div class="grid gap-5">
      <USelect
        v-model="direction"
        :items="[
          { label: 'JSON → YAML', value: 'json-yaml' },
          { label: 'YAML → JSON', value: 'yaml-json' },
        ]"
        value-key="value"
        label-key="label"
        class="w-full sm:max-w-xs"
      />
      <div class="grid gap-5 lg:grid-cols-2">
        <UTextarea
          v-model="input"
          :rows="14"
          class="w-full"
          placeholder="Paste JSON or YAML…"
        />
        <UTextarea
          :model-value="output"
          :rows="14"
          class="w-full"
          readonly
          placeholder="Converted output appears here."
        />
      </div>
      <div class="flex justify-end">
        <UButton
          color="neutral"
          variant="soft"
          label="Copy output"
          icon="i-tabler-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
