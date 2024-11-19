<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below to count the number of characters and words.
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

      <div class="flex flex-col gap-3 px-2">
        <div>
          No. of words: <span class="text-lg font-bold text-foreground">{{ wordsCount }}</span>
        </div>
        <div>
          No. of characters (with spaces):
          <span class="text-lg font-bold"> {{ charactersCount }}</span>
        </div>
        <div>
          No. of characters (without spaces):
          <span class="text-lg font-bold">{{ charactersCountWithoutSpaces }} </span>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script setup lang="ts">
const inputString = ref("");

const wordsCount = computed(() => {
  const trimmedString = inputString.value.trim();
  return trimmedString ? trimmedString.split(/\s+/).length : 0;
});
const charactersCount = computed(() => inputString.value.length);
const charactersCountWithoutSpaces = computed(() => inputString.value.replace(/\s/g, "").length);
</script>
