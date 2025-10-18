<script lang="ts" setup>
import type { RadioGroupItem } from "@nuxt/ui";

type SortBy = "alphabetically" | "length" | "numerically";

const items: RadioGroupItem[] = [
  { label: "Sort Alphabetically", value: "alphabetically" },
  { label: "Sort Length", value: "length" },
  { label: "Sort Numerically", value: "numerically" },
];

const input = ref("");
const operation = ref<SortBy>("alphabetically");

const output = computed(() => {
  const lines = input.value.split("\n").filter((line) => line.trim() !== "");

  return sortText(lines);
});

function sortText(lines: Array<string>) {
  switch (operation.value) {
    case "alphabetically":
      return lines.sort((a, b) => a.localeCompare(b)).join("\n");
    case "length":
      return lines.sort((a, b) => a.length - b.length).join("\n");
    case "numerically":
      return lines
        .filter((line) => !isNaN(parseFloat(line))) // Keep only numeric lines
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .join("\n");
    default:
      return input.value;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 items-center text-lg">
    <span class="w-full">
      Enter text below and choose sorting type to sort.
    </span>
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
    <div
      class="flex items-center justify-center w-full gap-12 max-md:flex-col mt-2"
    >
      <URadioGroup
        v-model="operation"
        :items="items"
        orientation="horizontal"
        :ui="{
          fieldset: 'gap-x-8',
        }"
      />
    </div>
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
