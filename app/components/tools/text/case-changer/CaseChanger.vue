<script lang="ts" setup>
import type { RadioGroupItem } from "@nuxt/ui";

const items: RadioGroupItem[] = [
  { label: "Lowercase", value: "lowercase" },
  { label: "Uppercase", value: "uppercase" },
  { label: "Sentence", value: "sentence" },
  { label: "Capitalize", value: "capitalize" },
];

type CaseType = "lowercase" | "uppercase" | "sentence" | "capitalize";

const input = ref("");
const operation = ref<CaseType>("lowercase");

const output = computed(() => {
  return getConvertedText(input.value, operation.value);
});

function getConvertedText(text: string, toCase: CaseType) {
  switch (toCase) {
    case "lowercase":
      return text.toLowerCase();
    case "uppercase":
      return text.toUpperCase();
    case "sentence":
      return toSentenceCase(text);
    case "capitalize":
      return toCapitalCase(text);
  }
}

function toSentenceCase(str: string) {
  if (str.length === 0) return str;

  // Trim leading and trailing spaces, then convert first character to uppercase and the rest to lowercase
  return str.trim().charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toCapitalCase(text: string) {
  return text.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-lg">
    <span class="w-full"> Enter text below and choose case to convert. </span>
    <UFormField
      class="w-full"
      label="Your Input"
    >
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
    <div class="mt-2 flex w-full items-center justify-center gap-12 max-md:flex-col">
      <URadioGroup
        v-model="operation"
        :items="items"
        orientation="horizontal"
        :ui="{
          fieldset: 'gap-x-8',
        }"
      />
    </div>
    <UFormField
      class="w-full"
      label="Output"
    >
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
