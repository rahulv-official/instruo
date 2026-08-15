<script setup lang="ts">
const input = ref("name,score\nAda,10\nLinus,9");
const { copyText } = useCopyToClipboard();

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error("Close the quoted CSV value.");
  values.push(value.trim());
  return values;
}

const result = computed(() => {
  try {
    const lines = input.value.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) return { output: "", error: "" };
    const headers = parseCsvLine(lines[0]!);
    if (headers.some((header) => !header)) throw new Error("Every CSV column needs a header.");
    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      if (values.length !== headers.length)
        throw new Error("Every row must have the same number of columns.");
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
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
        color="neutral"
        variant="soft"
        label="Copy JSON"
        icon="i-tabler-copy"
        :disabled="!result.output"
        @click="copyText(result.output)"
      />
    </div>
  </ToolWorkbench>
</template>
