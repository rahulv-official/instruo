<script setup lang="ts">
const count = ref(3);
const { copyText } = useCopyToClipboard();
const sentences = [
  "Small tools keep work moving.",
  "Good interfaces make busy tasks feel clear.",
  "Useful defaults remove needless friction.",
  "A focused browser tab can solve a surprising amount.",
  "Simple output is easier to trust and reuse.",
  "Local utilities respect your time and data.",
];
const output = computed(() =>
  Array.from(
    { length: Math.max(1, Math.min(12, count.value || 1)) },
    (_, index) => sentences[index % sentences.length],
  ).join(" "),
);
</script>

<template>
  <ToolWorkbench description="Generate short placeholder copy locally for drafts and prototypes.">
    <div class="mx-auto grid max-w-xl gap-6">
      <UFormField label="Sentence count">
        <UInput
          v-model.number="count"
          type="number"
          min="1"
          max="12"
          size="xl"
          class="w-full"
        />
      </UFormField>
      <p class="border-default/70 text-muted border p-5 text-base leading-8">{{ output }}</p>
      <div class="flex justify-end">
        <UButton
          label="Copy text"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
