<script setup lang="ts">
const minute = ref("*");
const hour = ref("*");
const day = ref("*");
const month = ref("*");
const weekday = ref("*");
const expression = computed(
  () => `${minute.value} ${hour.value} ${day.value} ${month.value} ${weekday.value}`,
);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Build a five-field cron schedule from familiar fields.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-5">
        <UFormField label="Minute">
          <UInput
            v-model="minute"
            placeholder="*"
          /> </UFormField
        ><UFormField label="Hour">
          <UInput
            v-model="hour"
            placeholder="*"
          /> </UFormField
        ><UFormField label="Day">
          <UInput
            v-model="day"
            placeholder="*"
          /> </UFormField
        ><UFormField label="Month">
          <UInput
            v-model="month"
            placeholder="*"
          /> </UFormField
        ><UFormField label="Weekday">
          <UInput
            v-model="weekday"
            placeholder="*"
          />
        </UFormField>
      </div>
      <UInput
        :model-value="expression"
        readonly
        class="font-mono"
      />
      <div class="flex justify-end">
        <UButton
          color="neutral"
          variant="soft"
          label="Copy cron"
          icon="i-tabler-copy"
          @click="copyText(expression)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
