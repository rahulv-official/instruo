<script setup lang="ts">
const input = ref(
  `<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>\n<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`,
);
const prefix = ref("icon");
const { copyText } = useCopyToClipboard();
const symbols = computed(() =>
  [...input.value.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi)].map((match, index) => ({
    id: `${prefix.value || "icon"}-${index + 1}`,
    attributes: match[1] ?? "",
    body: match[2] ?? "",
  })),
);
const output = computed(
  () =>
    `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.value.map((symbol) => `  <symbol id="${symbol.id}" ${symbol.attributes}>${symbol.body}</symbol>`).join("\n")}\n</svg>`,
);
</script>

<template>
  <ToolWorkbench
    description="Combine standalone SVG files into one reusable symbol sprite locally."
  >
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <UFormField label="ID prefix"
          ><UInput
            v-model="prefix"
            class="w-full font-mono"
        /></UFormField>
        <UFormField
          label="SVG files"
          help="Paste complete SVG elements one after another."
          ><UTextarea
            v-model="input"
            :rows="10"
            class="w-full font-mono"
        /></UFormField>
      </div>
      <p class="text-muted text-sm">
        {{ symbols.length }} symbol{{ symbols.length === 1 ? "" : "s" }} detected.
      </p>
      <UFormField label="Sprite output"
        ><UTextarea
          :model-value="output"
          :rows="12"
          readonly
          class="w-full font-mono"
      /></UFormField>
      <div class="flex justify-end">
        <UButton
          label="Copy sprite"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          :disabled="!symbols.length"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
