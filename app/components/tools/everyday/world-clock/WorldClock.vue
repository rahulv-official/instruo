<script setup lang="ts">
const tick = ref(0);
const zones = ref(["Local", "UTC", "America/New_York", "Asia/Tokyo"]);
const options = [
  "Local",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Los_Angeles",
];
const now = computed(() => {
  void tick.value;
  return new Date();
});
const clocks = computed(() =>
  zones.value.map((zone) => ({
    zone,
    label:
      zone === "Local"
        ? "Local time"
        : (zone.replace("_", " ").split("/").pop()?.replace("_", " ") ?? zone),
    time: new Intl.DateTimeFormat(undefined, {
      timeZone: zone === "Local" ? undefined : zone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now.value),
    date: new Intl.DateTimeFormat(undefined, {
      timeZone: zone === "Local" ? undefined : zone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(now.value),
  })),
);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    tick.value += 1;
  }, 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <ToolWorkbench
    description="Keep an at-a-glance view of important time zones without sending your data anywhere."
  >
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          v-for="(_, index) in zones"
          :key="index"
          :label="`Clock ${index + 1}`"
        >
          <USelect
            v-model="zones[index]"
            :items="options"
          />
        </UFormField>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="clock in clocks"
          :key="clock.zone"
          class="border-default bg-elevated border p-4"
        >
          <p class="text-muted text-sm">{{ clock.label }}</p>
          <p class="text-highlighted mt-2 font-mono text-2xl font-semibold tabular-nums">
            {{ clock.time }}
          </p>
          <p class="text-muted mt-1 text-sm">{{ clock.date }}</p>
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
