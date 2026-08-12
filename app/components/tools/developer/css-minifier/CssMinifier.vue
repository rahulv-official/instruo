<script setup lang="ts">
const input = ref("");
const { copyText } = useCopyToClipboard();
const output = computed(() =>
  input.value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;\}/g, "}")
    .trim(),
);
</script>

<template>
  <ToolWorkbench description="Remove comments and unnecessary whitespace from CSS locally.">
    <div class="grid gap-6 lg:grid-cols-2">
      <UFormField label="CSS input">
        <UTextarea
          v-model="input"
          autoresize
          :rows="14"
          class="w-full font-mono"
          placeholder=".card { color: black; }"
        />
      </UFormField><UFormField label="Minified CSS">
        <UTextarea
          :model-value="output"
          readonly
          :rows="14"
          class="w-full font-mono"
          placeholder="Minified CSS appears here."
        />
      </UFormField>
    </div>
    <div class="mt-5 flex justify-end">
      <UButton
        label="Copy CSS"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        :disabled="!output"
        @click="copyText(output)"
      />
    </div>
  </ToolWorkbench>
</template>
