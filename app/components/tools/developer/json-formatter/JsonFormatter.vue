<script setup lang="ts">
const props = defineProps<{ mode: "format" | "minify" }>();

const input = ref("");
const placeholder = '{"project":"instruo","open":true}';
const { copyText } = useCopyToClipboard();

const result = computed(() => {
  if (!input.value.trim()) return { output: "", error: "" };

  try {
    return {
      output: JSON.stringify(JSON.parse(input.value), null, props.mode === "format" ? 2 : 0),
      error: "",
    };
  } catch (error) {
    return {
      output: "",
      error: error instanceof Error ? error.message : "JSON is invalid.",
    };
  }
});

const output = computed(() => result.value.output);
const errorMessage = computed(() => result.value.error);
</script>

<template>
  <ToolWorkbench
    :description="`JSON ${mode === 'format' ? 'formatting' : 'minification'} runs as you type.`"
  >
    <div class="grid gap-6">
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField
          label="JSON input"
          :error="errorMessage || undefined"
        >
          <UTextarea
            v-model="input"
            :placeholder="placeholder"
            autoresize
            :rows="14"
            :maxrows="22"
            class="w-full"
            :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
          />
        </UFormField>
        <UFormField label="Valid JSON output">
          <UTextarea
            :model-value="output"
            readonly
            placeholder="Valid output appears here."
            autoresize
            :rows="14"
            :maxrows="22"
            class="w-full"
            :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
          />
        </UFormField>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          label="Clear"
          color="neutral"
          variant="ghost"
          icon="i-lucide-rotate-ccw"
          :disabled="!input"
          @click="input = ''"
        />
        <UButton
          label="Copy output"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
