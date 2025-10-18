<script lang="ts" setup>
import type { RadioGroupItem } from "@nuxt/ui";

const items: RadioGroupItem[] = [
  {
    label: "Text To Binary",
    description: "Encode Text to Binary",
    value: "encode",
  },
  {
    label: "Binary To Text",
    description: "Decode Binary to Text",
    value: "decode",
  },
];

const toast = useToast();

const operation = ref<"encode" | "decode">("encode");
const input = ref("");
const output = ref("");

function encode(text: string): string {
  if (text.trim().length === 0) {
    return "";
  }
  try {
    return Array.from(text)
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0")) // Ensure each binary string is 8 bits
      .join(" ");
  } catch (error) {
    toast.add({
      title: "Encoding Error",
      description: `Failed to convert text to Binary: ${
        (error as Error).message
      }`,
      color: "error",
    });
    return "";
  }
}

function decode(text: string): string {
  if (text.trim().length === 0) {
    return "";
  }
  try {
    const binaryArray = text.trim().split(" ");
    return binaryArray
      .map((binary) => String.fromCharCode(parseInt(binary, 2)))
      .join("");
  } catch (error) {
    toast.add({
      title: "Decoding Error",
      description: `Failed to convert Binary to text: ${
        (error as Error).message
      }`,
      color: "error",
    });
    return "Invalid Binary string.";
  }
}

function runOperation() {
  if (operation.value === "encode") {
    output.value = encode(input.value);
  } else {
    output.value = decode(input.value);
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 items-center text-lg">
    <span class="w-full">
      Enter text below and choose encode/decode to/from Binary.</span
    >
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
      <UButton
        :label="operation"
        class="capitalize h-full"
        trailing-icon="tabler:rocket"
        size="xl"
        @click="runOperation"
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
