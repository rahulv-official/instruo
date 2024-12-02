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
  { label: "Text to Binary", id: "textToBinary" },
  { label: "Binary to Text", id: "binaryToText" },
];

const inputString = ref("");
const selectedCase = ref<"binaryToText" | "textToBinary">("textToBinary");

const outputString = computed(() => {
  return getConvertedText(inputString.value, selectedCase.value);
});

function getConvertedText(text: string, toCase: "binaryToText" | "textToBinary") {
  switch (toCase) {
    case "binaryToText":
      return binaryToText(text);
    case "textToBinary":
      return textToBinary(text);
  }
}

function binaryToText(str: string): string {
  try {
    const binaryArray = str.trim().split(" ");
    return binaryArray.map((binary) => String.fromCharCode(parseInt(binary, 2))).join("");
  } catch (error) {
    alert("Error converting binary to text:", error);
    return "Invalid binary input.";
  }
}

function textToBinary(str: string): string {
  try {
    return Array.from(str)
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0")) // Ensure each binary string is 8 bits
      .join(" ");
  } catch (error) {
    alert("Error converting text to binary:", error);
    return "Invalid text input.";
  }
}
</script>
