<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter URL below and choose encode/decode.
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
          :rows="5"
        ></Textarea>
      </div>

      <!-- Radio Group -->
      <Label
        for="optionsGroup"
        class="ml-2"
      >
        URL:
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
          :rows="5"
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
  { label: "Encode", id: "encode" },
  { label: "Decode", id: "decode" },
];

const inputString = ref("");
const selectedCase = ref<"encode" | "decode">("encode");

const outputString = computed(() => {
  return getConvertedText(inputString.value, selectedCase.value);
});

function getConvertedText(text: string, toCase: "encode" | "decode") {
  switch (toCase) {
    case "encode":
      return encode(text);
    case "decode":
      return decode(text);
  }
}

function encode(str: string): string {
  if (!isValidURL(str)) {
    return "Invalid URL. Please enter a valid URL.";
  }
  try {
    return encodeURIComponent(str);
  } catch (error) {
    alert("Error encoding URL:", error);
    return "";
  }
}

function decode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (error) {
    alert("Error decoding URL:", error);
    return "Invalid URL string.";
  }
}

function isValidURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
</script>
