<script lang="ts" setup>
const input = ref("");

const output = computed(() => {
  const lines = input.value.split("\n");
  const uniqueLines = [...new Set(lines)];
  return uniqueLines.join("\n");
});
</script>

<template>
  <div class="flex flex-col gap-4 items-center text-lg">
    <span class="w-full"> Enter text below to remove duplicate lines. </span>
    <UFormField class="w-full" label="Your Input">
      <UTextarea
        v-model="input"
        placeholder="Your input"
        class="w-full"
        :rows="10"
        :ui="{
          base: 'p-4 text-base',
        }"
      />
    </UFormField>
    <UFormField class="w-full" label="Output">
      <UTextarea
        v-model="output"
        disabled
        class="w-full"
        :rows="10"
        :ui="{
          base: 'p-4 text-base',
        }"
      />
    </UFormField>
    <UButton
      label="Copy Output To Clipboard"
      icon="tabler:copy"
      block
      size="xl"
      @click="() => useCopyToClipboard(output)"
    />
  </div>
</template>
