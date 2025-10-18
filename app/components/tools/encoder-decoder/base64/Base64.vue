<script lang="ts" setup>
import type { RadioGroupItem } from "@nuxt/ui";
import { isValidBase64 } from "~/lib/utils";

const items: RadioGroupItem[] = [
  {
    label: "Text To Base64",
    description: "Encode Text to Base64",
    value: "encode",
  },
  {
    label: "Base64 To Text",
    description: "Decode Base64 to Text",
    value: "decode",
  },
];

const toast = useToast();

const operation = ref<"encode" | "decode">("encode");
const input = ref("");
const output = ref("");

function textToBase64(text: string): string {
  if (text.trim().length === 0) {
    return "";
  }
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (error) {
    toast.add({
      title: "Encoding Error",
      description: `Failed to convert text to Base64: ${(error as Error).message}`,
      color: "error",
    });
    return "";
  }
}

function base64ToText(base64: string): string {
  if (base64.trim().length === 0) {
    return "";
  }
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    toast.add({
      title: "Decoding Error",
      description: `Failed to convert Base64 to text: ${(error as Error).message}`,
      color: "error",
    });
    return "Invalid Base64 string.";
  }
}

function runOperation() {
  if (operation.value === "encode") {
    output.value = textToBase64(input.value);
  } else {
    if (isValidBase64(input.value)) {
      output.value = base64ToText(input.value);
    }
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-lg">
    <span class="w-full"> Enter text below and choose encode/decode to/from base64. </span>
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
      <UButton
        :label="operation"
        class="h-full capitalize"
        trailing-icon="tabler:rocket"
        size="xl"
        @click="runOperation"
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
