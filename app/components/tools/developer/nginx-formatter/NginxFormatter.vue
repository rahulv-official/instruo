<script setup lang="ts">
const input = ref(
  `server { listen 80; server_name example.com; location / { try_files $uri $uri/ /index.html; } }`,
);
const { copyText } = useCopyToClipboard();
const formatted = computed(() => {
  let depth = 0;
  let line = "";
  const lines: string[] = [];
  for (const char of input.value) {
    if (char === "{") {
      if (line.trim()) lines.push(`${"  ".repeat(depth)}${line.trim()} {`);
      else lines.push(`${"  ".repeat(depth)}{`);
      line = "";
      depth += 1;
    } else if (char === "}") {
      if (line.trim()) lines.push(`${"  ".repeat(depth)}${line.trim()}`);
      line = "";
      depth = Math.max(0, depth - 1);
      lines.push(`${"  ".repeat(depth)}}`);
    } else if (char === ";") {
      if (line.trim()) lines.push(`${"  ".repeat(depth)}${line.trim()};`);
      line = "";
    } else if (char === "\n") {
      if (line.trim()) lines.push(`${"  ".repeat(depth)}${line.trim()}`);
      line = "";
    } else line += char;
  }
  if (line.trim()) lines.push(`${"  ".repeat(depth)}${line.trim()}`);
  return lines.join("\n");
});
</script>

<template>
  <ToolWorkbench
    description="Make Nginx configuration easier to review, diff, and paste into a server block."
  >
    <div class="grid gap-5 lg:grid-cols-2">
      <UFormField label="Nginx configuration">
        <UTextarea
          v-model="input"
          :rows="18"
          class="w-full font-mono"
        />
      </UFormField>
      <div class="grid content-start gap-3">
        <UFormField label="Formatted configuration">
          <UTextarea
            :model-value="formatted"
            :rows="18"
            readonly
            class="w-full font-mono"
          />
        </UFormField>
        <UButton
          label="Copy configuration"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          class="w-fit"
          @click="copyText(formatted)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
