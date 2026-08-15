<script setup lang="ts">
const input = ref(
  "APP_NAME = Instruo\n   API_URL = https://example.com\n# Keep comments    with your config\nDEBUG=true",
);
const redact = ref(true);
const formatted = computed(() =>
  input.value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return trimmed;
      const separator = trimmed.indexOf("=");
      if (separator < 1) return trimmed;
      return `${trimmed.slice(0, separator).trim()}=${trimmed.slice(separator + 1).trim()}`;
    })
    .join("\n"),
);
const preview = computed(() => {
  if (!redact.value) return formatted.value;
  return formatted.value.replace(
    /^([A-Z_]\w*(?:KEY|SECRET|TOKEN|PASSWORD|PRIVATE)\w*)=(.*)$/gim,
    "$1=••••••",
  );
});
const { copyText } = useCopyToClipboard();
</script>

<template>
  <ToolWorkbench
    description="Normalize .env spacing locally while keeping comments and values intact."
  >
    <div class="grid gap-5">
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label=".env input">
          <UTextarea
            v-model="input"
            :rows="14"
            class="w-full font-mono"
          />
        </UFormField>
        <UFormField label="Formatted preview">
          <UTextarea
            :model-value="preview"
            :rows="14"
            readonly
            class="w-full font-mono"
          />
        </UFormField>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UCheckbox
          v-model="redact"
          label="Redact secret-looking values in preview"
        />
        <UButton
          color="neutral"
          variant="soft"
          label="Copy formatted .env"
          icon="i-tabler-copy"
          :disabled="!formatted"
          @click="copyText(formatted)"
        />
      </div>
      <p class="text-muted text-sm">
        Formatting never writes to disk or sends your environment variables anywhere.
      </p>
    </div>
  </ToolWorkbench>
</template>
