<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below and choose the encoding/decoding format.
      </UiCardDescription>
    </UiCardHeader>
    <UiCardContent class="grid w-full items-center gap-4">
      <!-- Input String -->
      <div class="grid w-full gap-1.5">
        <Label
          for="inputString"
          class="text-sm"
        >
          Your Input
        </Label>
        <Textarea
          id="inputString"
          v-model="inputString"
          placeholder="Enter your string."
          :rows="10"
        ></Textarea>
      </div>

      <!-- Radio Group -->
      <Label
        for="optionsGroup"
        class="ml-2"
      >
        Encode/Decode to:
      </Label>
      <RadioGroup
        id="optionsGroup"
        v-model="selectedCase"
        class="ml-4 flex items-center gap-4 max-md:flex-col max-md:items-start"
      >
        <div
          v-for="option in options"
          :key="option.id"
          class="flex items-center space-x-2"
        >
          <RadioGroupItem
            :id="option.id"
            :value="option.id"
          />
          <Label :for="option.id">{{ option.label }}</Label>
        </div>
      </RadioGroup>

      <!-- Output String -->
      <div class="grid w-full gap-1.5">
        <Label
          for="outputString"
          class="text-sm"
        >
          Output
        </Label>
        <Textarea
          id="outputString"
          :rows="10"
          disabled
          :value="outputString"
        ></Textarea>
      </div>

      <!-- Copy to Clipboard Button -->
      <UiButton @click="copyToClipboard(outputString)"> Copy output to clipboard </UiButton>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
import { copyToClipboard } from "~/lib/utils";

const options = [
  { label: "Text to Morse Code", id: "textToMorseCode" },
  { label: "Morse Code to Text", id: "morseCodeToText" },
];

const inputString = ref("");
const selectedCase = ref<"morseCodeToText" | "textToMorseCode">("textToMorseCode");

const outputString = computed(() => {
  return getConvertedText(inputString.value, selectedCase.value);
});

function getConvertedText(text: string, toCase: "morseCodeToText" | "textToMorseCode") {
  switch (toCase) {
    case "morseCodeToText":
      return morseCodeToText(text);
    case "textToMorseCode":
      return textToMorseCode(text);
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
</script>
