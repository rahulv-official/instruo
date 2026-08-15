<script setup lang="ts">
const dateTime = ref("");
const sourceTimezone = ref("UTC");
const targetTimezone = ref("Asia/Kolkata");
const timezones = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "Australia/Sydney",
];
function zonedDateToUtc(value: string, zone: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Choose a valid date and time.");
  const parts = match.slice(1).map(Number);
  const guess = Date.UTC(parts[0]!, parts[1]! - 1, parts[2], parts[3], parts[4]);
  if (zone === "UTC") return new Date(guess);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const actual = Object.fromEntries(
    formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]),
  );
  const actualAsUtc = Date.UTC(
    Number(actual.year),
    Number(actual.month) - 1,
    Number(actual.day),
    Number(actual.hour),
    Number(actual.minute),
  );
  return new Date(guess + (guess - actualAsUtc));
}

const output = computed(() => {
  if (!dateTime.value) return "Choose a date and time to convert.";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: targetTimezone.value,
    }).format(zonedDateToUtc(dateTime.value, sourceTimezone.value));
  } catch {
    return "Choose a valid date and time.";
  }
});

onMounted(() => {
  dateTime.value = new Date().toISOString().slice(0, 16);
});
</script>

<template>
  <ToolWorkbench
    description="See one date and time across common time zones, locally in your browser."
  >
    <div class="grid max-w-2xl gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Date and time">
          <UInput
            v-model="dateTime"
            type="datetime-local"
          />
        </UFormField>
        <UFormField label="Input time zone">
          <USelect
            v-model="sourceTimezone"
            :items="timezones"
          />
        </UFormField>
        <UFormField label="Convert to">
          <USelect
            v-model="targetTimezone"
            :items="timezones"
          />
        </UFormField>
      </div>
      <UAlert
        color="neutral"
        variant="subtle"
        title="Converted time"
        :description="output"
        icon="i-tabler-clock"
      />
    </div>
  </ToolWorkbench>
</template>
