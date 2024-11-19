<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below to get the frequency of the words.
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
          placeholder="Enter your string"
          :rows="10"
        ></Textarea>
      </div>

      <!-- Words to Find -->
      <div class="grid w-full gap-1.5">
        <Label
          for="wordsToFind"
          class="text-sm"
        >
          Words to find frequency for. (Separate by comma)
        </Label>
        <Input
          id="wordsToFind"
          v-model="wordsToFind"
          placeholder="words, to, look"
        ></Input>
      </div>

      <!-- Word Frequencies -->
      <div
        v-if="wordsList.length > 0"
        class="flex flex-col gap-3 px-2"
      >
        <div
          v-for="word in wordsList"
          :key="word"
        >
          No. of {{ word.trim() }}:
          <span class="text-lg font-bold text-foreground">{{
            wordFrequencies[word.trim()] || 0
          }}</span>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

const inputString = ref("");
const wordsToFind = ref("");

const wordsList = computed(() => {
  return wordsToFind.value
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word);
});

// Compute the frequency of each word in the input string
const wordFrequencies = computed(() => {
  const wordCounts: Record<string, number> = {};
  const words = inputString.value
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .map((word) => word.replace(/[^\w]/g, "")); // Remove punctuation

  // Count occurrences of each word
  for (const word of words) {
    if (word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  return wordCounts;
});
</script>
