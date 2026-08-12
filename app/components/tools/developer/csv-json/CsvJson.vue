<script setup lang="ts">
const input = ref("name,score\nAda,10\nLinus,9");
const { copyText } = useCopyToClipboard();
const result = computed(() => {
  try {
    const lines = input.value.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) return { output: "", error: "" };
    const headers = lines[0]!.split(",").map((item) => item.trim());
    const rows = lines
      .slice(1)
      .map((line) =>
        Object.fromEntries(
          headers.map((header, index) => [header, line.split(",")[index]?.trim() ?? ""]),
        ),
      );
    return { output: JSON.stringify(rows, null, 2), error: "" };
  } catch {
    return { output: "", error: "Could not parse CSV." };
  }
});
</script>

<template>
  <ToolWorkbench
    description="Convert simple comma-separated rows into a JSON array in your browser."
  >
    <div class="grid gap-6 lg:grid-cols-2">
      <UFormField label="CSV input">
        <UTextarea
          v-model="input"
          autoresize
          :rows="14"
          class="w-full font-mono"
          placeholder="name,score"
        /> </UFormField
      ><UFormField
        label="JSON output"
        :error="result.error || undefined"
      >
        <UTextarea
          :model-value="result.output"
          readonly
          :rows="14"
          class="w-full font-mono"
          placeholder="[]"
        />
      </UFormField>
    </div>
    <div class="mt-5 flex justify-end">
      <UButton
        label="Copy JSON"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        :disabled="!result.output"
        @click="copyText(result.output)"
      />
    </div>
  </ToolWorkbench>
</template>
