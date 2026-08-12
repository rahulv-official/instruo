<script setup lang="ts">
import type { JsonValue } from "~/utils/browser-tools";
import { jsonToYaml } from "~/utils/browser-tools";
const direction = ref<"json-yaml" | "yaml-json">("json-yaml");
const input = ref("");
const output = computed(() => {
  try {
    if (!input.value.trim()) return "";
    if (direction.value === "json-yaml") return jsonToYaml(JSON.parse(input.value) as JsonValue);
    const object: Record<string, string> = {};
    input.value.split(/\r?\n/).forEach((line) => {
      const [key, ...value] = line.split(":");
      if (key && value.length) object[key.trim()] = value.join(":").trim();
    });
    return JSON.stringify(object, null, 2);
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
          label="Copy output"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
