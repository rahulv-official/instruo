<script lang="ts" setup>
const input = ref("");

const wordsCount = computed(() => {
  const trimmedString = input.value.trim();
  return trimmedString ? trimmedString.split(/\s+/).length : 0;
});
const charactersCount = computed(() => input.value.length);
const charactersCountWithoutSpaces = computed(() => input.value.replace(/\s/g, "").length);
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-lg">
    <span class="w-full"> Enter text below to count the number of characters and words. </span>
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

    <div class="flex flex-col gap-3 px-2">
      <div>
        No. of words:
        <span class="text-foreground text-lg font-bold">{{ wordsCount }}</span>
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
  </div>
</template>
