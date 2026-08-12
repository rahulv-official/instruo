<script setup lang="ts">
const input = ref("");
const { copyText } = useCopyToClipboard();

const result = computed(() => {
  if (!input.value.trim()) return { url: null, error: "" };
  try {
    return { url: new URL(input.value.trim()), error: "" };
  } catch {
    return { url: null, error: "Enter a complete URL, including its protocol." };
  }
});

const fields = computed(() => {
  const url = result.value.url;
  if (!url) return [];
  return [
    ["Protocol", url.protocol],
    ["Origin", url.origin],
    ["Host", url.host],
    ["Path", url.pathname],
    ["Query", url.search || "None"],
    ["Hash", url.hash || "None"],
  ];
});

const output = computed(() =>
  fields.value.map(([label, value]) => `${label}: ${value}`).join("\n"),
);
</script>

<template>
  <ToolWorkbench description="Parse a URL into readable parts without sending it anywhere.">
    <div class="grid gap-6">
      <UFormField
        label="URL"
        description="Include https://, http://, or another supported protocol."
        :error="result.error || undefined"
      >
        <UInput
          v-model="input"
          size="xl"
          class="w-full"
          placeholder="https://example.com/path?query=1#section"
        />
      </UFormField>

      <dl
        v-if="fields.length"
        class="border-default/70 grid border-t border-l sm:grid-cols-2"
      >
        <div
          v-for="[label, value] in fields"
          :key="label"
          class="border-default/70 grid gap-2 border-r border-b p-4"
        >
          <dt class="text-toned font-mono text-xs">{{ label }}</dt>
          <dd class="text-highlighted font-mono text-sm break-all">{{ value }}</dd>
        </div>
      </dl>
      <p
        v-else
        class="text-muted border-default/70 border p-5 text-sm"
      >
        Parsed URL parts will appear here.
      </p>

      <div class="flex justify-end">
        <UButton
          label="Copy parts"
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
