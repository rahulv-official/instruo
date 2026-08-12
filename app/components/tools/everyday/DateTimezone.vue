<script setup lang="ts">
const dateTime = ref(new Date().toISOString().slice(0, 16));
const timezone = ref("UTC");
const timezones = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "Australia/Sydney",
];
const output = computed(() => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: timezone.value,
    }).format(new Date(dateTime.value));
  } catch {
    return "Choose a valid date and time.";
  }
});
</script>

<template>
  <ToolWorkbench
    description="See one date and time across common time zones, locally in your browser."
  >
    <div class="grid max-w-2xl gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Date and time"
          ><UInput
            v-model="dateTime"
            type="datetime-local"
        /></UFormField>
        <UFormField label="Display time zone"
          ><USelect
            v-model="timezone"
            :items="timezones"
        /></UFormField>
      </div>
      <UAlert
        color="neutral"
        variant="subtle"
        title="Converted time"
        :description="output"
        icon="i-lucide-clock-3"
      />
    </div>
  </ToolWorkbench>
</template>
