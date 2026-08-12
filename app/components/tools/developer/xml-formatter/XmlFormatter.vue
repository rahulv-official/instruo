<script setup lang="ts">
const input = ref("");
const { copyText } = useCopyToClipboard();
const output = computed(() => formatXml(input.value));
function formatXml(value: string) {
  if (!value.trim()) return "";
  let depth = 0;
  return value
    .replace(/>\s*</g, "><")
    .replace(/</g, "\n<")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("</")) depth -= 1;
      const formatted = `${"  ".repeat(Math.max(depth, 0))}${line}`;
      if (
        line.startsWith("<") &&
        !line.startsWith("</") &&
        !line.startsWith("<?") &&
        !line.includes("</") &&
        !line.endsWith("/>")
      )
        depth += 1;
      return formatted;
    })
    .join("\n")
    .trim();
}
</script>

<template>
  <ToolWorkbench
    description="Add readable indentation to XML without sending the document anywhere."
  >
    <div class="grid gap-6 lg:grid-cols-2">
      <UFormField label="XML input">
        <UTextarea
          v-model="input"
          autoresize
          :rows="14"
          class="w-full font-mono"
          placeholder="<root><item /></root>"
        /> </UFormField
      ><UFormField label="Formatted XML">
        <UTextarea
          :model-value="output"
          readonly
          :rows="14"
          class="w-full font-mono"
          placeholder="Formatted XML appears here."
        />
      </UFormField>
    </div>
    <div class="mt-5 flex justify-end">
      <UButton
        label="Copy XML"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        :disabled="!output"
        @click="copyText(output)"
      />
    </div>
  </ToolWorkbench>
</template>
