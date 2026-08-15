<script setup lang="ts">
const start = ref("#4f46e5");
const end = ref("#06b6d4");
const angle = ref(135);
const output = computed(
  () => `background: linear-gradient(${angle.value}deg, ${start.value}, ${end.value});`,
);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Build a copy-ready linear-gradient declaration with a live preview.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Start"><UInput v-model="start" /></UFormField
        ><UFormField label="End"><UInput v-model="end" /></UFormField
        ><UFormField label="Angle">
          <UInput
            v-model.number="angle"
            type="number"
          />
        </UFormField>
      </div>
      <div
        class="border-default min-h-40 border"
        :style="{ background: `linear-gradient(${angle}deg, ${start}, ${end})` }"
      />
      <UInput
        :model-value="output"
        readonly
        class="font-mono"
      /><UButton
        color="neutral"
        variant="soft"
        label="Copy CSS"
        icon="i-tabler-copy"
        class="w-fit"
        @click="copyText(output)"
      />
    </div>
  </ToolWorkbench>
</template>
