<script lang="ts" setup>
const input = ref("");
const wordsToFind = ref("");

const wordsList = computed(() => {
  return wordsToFind.value
    .split(",")
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word);
});

// Compute the frequency of each word in the input string
const wordFrequencies = computed(() => {
  const wordCounts: Record<string, number> = {};
  const words = input.value
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .map((word) => word.replace(/\W/g, "")); // Remove punctuation

  // Count occurrences of each word
  for (const word of words) {
    if (word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  return wordCounts;
});
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-lg">
    <span class="w-full"> Enter text below to get the frequency of the words. </span>
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
    <UFormField
      class="w-full"
      label="Words to find frequency for. (Separate by comma)"
    >
      <UInput
        v-model="wordsToFind"
        class="w-full"
        size="xl"
        placeholder="words, to, find"
      />
    </UFormField>

    <div
      v-if="wordsList.length > 0"
      class="flex flex-col gap-3 px-2"
    >
      <div
        v-for="word in wordsList"
        :key="word"
      >
        No. of {{ word.trim() }}:
        <span class="text-foreground text-lg font-bold">
          {{ wordFrequencies[word.trim()] || 0 }}
        </span>
      </div>
    </div>
  </div>
</template>
