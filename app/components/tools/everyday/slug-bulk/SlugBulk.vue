<script setup lang="ts">
const input = ref("");
const output = computed(() =>
  input.value
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) =>
      line
        .trim()
        .toLocaleLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .join("\n"),
);
const { copyText } = useCopyToClipboard();
</script>

<template>
  <ToolWorkbench description="Turn a list of titles into clean URL slugs in one pass.">
    <div class="grid gap-5 lg:grid-cols-2">
      <UTextarea
        v-model="input"
        :rows="12"
        placeholder="One title per line…"
      />
      <UTextarea
        :model-value="output"
        :rows="12"
        readonly
        placeholder="slug-output"
      />
      <div class="flex justify-end lg:col-span-2">
        <UButton
          color="neutral"
          variant="soft"
          label="Copy slugs"
          icon="i-tabler-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
