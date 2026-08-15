<script setup lang="ts">
const dateTime = ref("2026-01-15T09:00");
const zones = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];
const selectedZones = ref(["America/Los_Angeles", "Europe/London", "Asia/Kolkata", "Asia/Tokyo"]);
const labels = ["You", "Partner 1", "Partner 2", "Partner 3"];
const { copyText } = useCopyToClipboard();
function format(zone: string) {
  const value = new Date(dateTime.value);
  if (Number.isNaN(value.getTime())) return "Invalid time";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
function hour(zone: string) {
  const value = new Date(dateTime.value);
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hourCycle: "h23" }).format(
      value,
    ),
  );
}
const summary = computed(() =>
  selectedZones.value
    .map((zone, index) => `${labels[index]} · ${zone} · ${format(zone)}`)
    .join("\n"),
);
</script>

<template>
  <ToolWorkbench
    description="Find a meeting time across time zones. Reference time uses your device's local timezone."
  >
    <div class="grid gap-5">
      <UFormField label="Reference time"
        ><UInput
          v-model="dateTime"
          type="datetime-local"
          class="max-w-sm"
      /></UFormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          v-for="(zone, index) in selectedZones"
          :key="index"
          :label="labels[index]!"
          ><USelect
            v-model="selectedZones[index]"
            :items="zones"
            class="w-full"
        /></UFormField>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="(zone, index) in selectedZones"
          :key="`${zone}-${index}`"
          class="border-muted bg-muted/20 rounded-md border p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-muted text-sm">{{ zone }}</p>
            <span
              class="text-xs"
              :class="hour(zone) >= 9 && hour(zone) < 18 ? 'text-success' : 'text-muted'"
              >{{ hour(zone) >= 9 && hour(zone) < 18 ? "Work hours" : "Outside work hours" }}</span
            >
          </div>
          <p class="text-highlighted mt-3 text-lg font-semibold">{{ format(zone) }}</p>
        </div>
      </div>
      <div class="flex justify-end">
        <UButton
          label="Copy time summary"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          @click="copyText(summary)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
