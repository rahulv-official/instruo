<script lang="ts" setup>
import type { RadioGroupItem } from "@nuxt/ui";

const items: RadioGroupItem[] = [
  {
    label: "Text To Morse Code",
    description: "Encode Text to Morse Code",
    value: "encode",
  },
  {
    label: "Morse Code To Text",
    description: "Decode Morse Code to Text",
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
    return textToMorseCode(text);
  } catch (error) {
    toast.add({
      title: "Encoding Error",
      description: `Failed to convert text to Morse Code: ${(error as Error).message}`,
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
    return morseCodeToText(text);
  } catch (error) {
    toast.add({
      title: "Decoding Error",
      description: `Failed to convert Morse Code to text: ${(error as Error).message}`,
      color: "error",
    });
    return "Invalid Morse Code string.";
  }
}

function morseCodeToText(str: string): string {
  const morseToText: Record<string, string> = {
    ".-": "A",
    "-...": "B",
    "-.-.": "C",
    "-..": "D",
    ".": "E",
    "..-.": "F",
    "--.": "G",
    "....": "H",
    "..": "I",
    ".---": "J",
    "-.-": "K",
    ".-..": "L",
    "--": "M",
    "-.": "N",
    "---": "O",
    ".--.": "P",
    "--.-": "Q",
    ".-.": "R",
    "...": "S",
    "-": "T",
    "..-": "U",
    "...-": "V",
    ".--": "W",
    "-..-": "X",
    "-.--": "Y",
    "--..": "Z",
    "-----": "0",
    ".----": "1",
    "..---": "2",
    "...--": "3",
    "....-": "4",
    ".....": "5",
    "-....": "6",
    "--...": "7",
    "---..": "8",
    "----.": "9",
    "/": " ", // Separator for words
  };

  return str
    .trim()
    .split(" ") // Morse code words and characters are separated by spaces
    .map((code) => morseToText[code.toUpperCase()] || "")
    .join("");
}

function textToMorseCode(str: string): string {
  const textToMorse: Record<string, string> = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    "0": "-----",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    " ": "/", // Separator for words
  };

  return str
    .toUpperCase()
    .split("") // Convert each character to Morse code
    .map((char) => textToMorse[char] || "")
    .join(" ");
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
  <div class="flex flex-col items-center gap-4 text-lg">
    <span class="w-full"> Enter text below and choose encode/decode to/from Morse Code. </span>
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
