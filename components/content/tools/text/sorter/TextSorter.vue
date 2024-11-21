<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below and choose sorting type to sort.
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
        Sort:
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

type SortBy = "alphabetically" | "length" | "numerically";

const options = [
  { label: "Alphabetically", id: "alphabetically" },
  { label: "By Length", id: "length" },
  { label: "Numerically", id: "numerically" },
];

const inputString = ref("");
const selectedCase = ref<SortBy>("alphabetically");

const outputString = computed(() => {
  const lines = inputString.value.split("\n").filter((line) => line.trim() !== "");

  return sortText(lines);
});

function sortText(lines: Array<string>) {
  switch (selectedCase.value) {
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
      return inputString.value;
  }
}
</script>
