<script setup lang="ts">
const input = ref("");
const output = computed(() => {
  const rows = input.value
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.split("\t"));
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
  return [
    `| ${normalized[0]!.join(" | ")} |`,
    `| ${normalized[0]!.map(() => "---").join(" | ")} |`,
    ...normalized.slice(1).map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
});
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Turn tab-separated rows into a clean Markdown table.">
    <div class="grid gap-5 lg:grid-cols-2">
      <UTextarea
        v-model="input"
        :rows="12"
        placeholder="Name\tRole\nAda\tEngineer"
      /><UTextarea
        :model-value="output"
        :rows="12"
        readonly
      />
      <div class="flex justify-end lg:col-span-2">
        <UButton
          color="neutral"
          variant="soft"
          label="Copy table"
          icon="i-tabler-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
