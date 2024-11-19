<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below and choose case to convert.
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
        Select case:
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
      <UiButton @click="copyToClipboard"> Copy output to clipboard </UiButton>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
export type CaseType = "lowercase" | "uppercase" | "sentence" | "capitalize";

const options = [
  { label: "Lowercase", id: "lowercase" },
  { label: "Uppercase", id: "uppercase" },
  { label: "Sentence", id: "sentence" },
  { label: "Capitalize", id: "capitalize" },
];

const inputString = ref("");
const selectedCase = ref("lowercase");

const outputString = computed(() => {
  return getConvertedText(inputString.value, selectedCase.value);
});

function copyToClipboard() {
  navigator.clipboard.writeText(outputString.value).then(() => {
    alert("Output copied to clipboard!");
  });
}

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
