<template>
  <UiCard>
    <UiCardHeader>
      <UiCardDescription class="text-md">
        Enter text below and choose case to convert.
      </UiCardDescription>
    </UiCardHeader>
    <UiCardContent class="grid w-full items-center gap-4">
      <div class="grid w-full gap-1.5">
        <Label
          for="inputString"
          class="text-sm"
        >
          Your Input
        </Label>
        <Textarea
          id="inputString"
          placeholder="Enter your string."
          :rows="10"
        ></Textarea>
      </div>

      <Label
        for="optionsGroup"
        class="ml-2"
      >
        Select case:
      </Label>
      <RadioGroup
        id="optionsGroup"
        :default-value="options[0].id"
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
        ></Textarea>
      </div>

      <UiButton> Copy output to clipboard </UiButton>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
const options = [
  {
    label: "Lowercase",
    id: "lowercase",
  },
  {
    label: "Uppercase",
    id: "uppercase",
  },
  {
    label: "Sentence",
    id: "sentence",
  },
  {
    label: "Capitalize",
    id: "capitalize",
  },
];
</script>
