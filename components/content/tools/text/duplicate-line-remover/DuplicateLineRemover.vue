<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below to remove duplicate lines.
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

const inputString = ref("");

const outputString = computed(() => {
  const lines = inputString.value.split("\n");
  const uniqueLines = [...new Set(lines)];
  return uniqueLines.join("\n");
});
</script>
