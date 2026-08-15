<script setup lang="ts">
const start = ref("2026-01-01");
const end = ref("2026-01-31");
const holidays = ref("2026-01-26");
const includeEndpoints = ref(true);
const weekendDays = ref<Record<number, boolean>>({ 0: true, 6: true });
const result = computed(() => {
  const first = new Date(`${start.value}T00:00:00`);
  const last = new Date(`${end.value}T00:00:00`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || last < first)
    return { error: "Choose an end date on or after start date." };
  const holidaySet = new Set(holidays.value.split(/\s+/).filter(Boolean));
  let calendar = 0;
  let working = 0;
  let skippedHolidays = 0;
  for (let timestamp = first.getTime(); timestamp <= last.getTime(); timestamp += 86_400_000) {
    const date = new Date(timestamp);
    calendar += 1;
    const key = date.toISOString().slice(0, 10);
    const endpointExcluded = !includeEndpoints.value && (key === start.value || key === end.value);
    if (weekendDays.value[date.getDay()] || holidaySet.has(key) || endpointExcluded) {
      if (holidaySet.has(key)) skippedHolidays += 1;
      continue;
    }
    working += 1;
  }
  return { calendar, working, skippedHolidays, error: "" };
});
</script>

<template>
  <ToolWorkbench description="Count working days between dates with custom weekends and holidays.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Start date"
          ><UInput
            v-model="start"
            type="date"
            class="w-full"
        /></UFormField>
        <UFormField label="End date"
          ><UInput
            v-model="end"
            type="date"
            class="w-full"
        /></UFormField>
      </div>
      <UFormField
        label="Holiday dates"
        help="One YYYY-MM-DD date per line or separated by spaces."
        ><UTextarea
          v-model="holidays"
          :rows="4"
          class="w-full font-mono"
      /></UFormField>
      <div class="flex flex-wrap items-center gap-4">
        <UCheckbox
          v-model="includeEndpoints"
          label="Include start and end dates"
        /><span class="text-muted text-sm"
          >Weekend:
          <label
            v-for="day in [0, 6]"
            :key="day"
            class="ml-3 inline-flex items-center gap-1"
            ><input
              v-model="weekendDays[day]"
              type="checkbox"
            />{{ day === 0 ? "Sun" : "Sat" }}</label
          ></span
        >
      </div>
      <UAlert
        v-if="result.error"
        color="error"
        variant="subtle"
        title="Check dates"
        :description="result.error"
      />
      <div
        v-else
        class="grid gap-3 sm:grid-cols-3"
      >
        <div class="bg-muted/20 rounded-md p-4">
          <p class="text-muted text-xs">Working days</p>
          <p class="text-highlighted mt-1 text-3xl font-semibold">{{ result.working }}</p>
        </div>
        <div class="bg-muted/20 rounded-md p-4">
          <p class="text-muted text-xs">Calendar days</p>
          <p class="text-highlighted mt-1 text-3xl font-semibold">{{ result.calendar }}</p>
        </div>
        <div class="bg-muted/20 rounded-md p-4">
          <p class="text-muted text-xs">Holidays skipped</p>
          <p class="text-highlighted mt-1 text-3xl font-semibold">{{ result.skippedHolidays }}</p>
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
