<script setup lang="ts">
import { useLocalStorage, useMounted, useNow } from "@vueuse/core";

interface ClockPreference {
  id: string;
  zone: string;
}

const defaultClocks: ClockPreference[] = [
  { id: "local", zone: "Local" },
  { id: "utc", zone: "UTC" },
  { id: "new-york", zone: "America/New_York" },
  { id: "tokyo", zone: "Asia/Tokyo" },
];

const zoneOptions = [
  { label: "Local time", value: "Local" },
  { label: "UTC", value: "UTC" },
  { label: "Los Angeles", value: "America/Los_Angeles" },
  { label: "New York", value: "America/New_York" },
  { label: "Toronto", value: "America/Toronto" },
  { label: "São Paulo", value: "America/Sao_Paulo" },
  { label: "London", value: "Europe/London" },
  { label: "Paris", value: "Europe/Paris" },
  { label: "Berlin", value: "Europe/Berlin" },
  { label: "Dubai", value: "Asia/Dubai" },
  { label: "Kolkata", value: "Asia/Kolkata" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Tokyo", value: "Asia/Tokyo" },
  { label: "Sydney", value: "Australia/Sydney" },
  { label: "Auckland", value: "Pacific/Auckland" },
];

const savedClocks = useLocalStorage<ClockPreference[]>("instruo-world-clock-zones", defaultClocks, {
  initOnMounted: true,
});
const timeFormat = useLocalStorage<"12" | "24">("instruo-world-clock-format", "12", {
  initOnMounted: true,
});
const mounted = useMounted();
const now = useNow({ interval: 1000 });
const { copyText } = useCopyToClipboard();

function zoneLabel(zone: string) {
  return zoneOptions.find((option) => option.value === zone)?.label ?? zone.replaceAll("_", " ");
}

function formatInZone(zone: string, options: Intl.DateTimeFormatOptions) {
  if (!mounted.value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: zone === "Local" ? undefined : zone,
    }).format(now.value);
  } catch {
    return "Unavailable";
  }
}

const clocks = computed(() =>
  savedClocks.value.map((clock) => ({
    ...clock,
    label: zoneLabel(clock.zone),
    time: formatInZone(clock.zone, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: timeFormat.value === "12",
    }),
    date: formatInZone(clock.zone, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    offset: formatInZone(clock.zone, {
      timeZoneName: "shortOffset",
    })
      .split(", ")
      .at(-1),
  })),
);

function updateZone(index: number, zone: string | undefined) {
  if (!zone) return;
  savedClocks.value = savedClocks.value.map((clock, clockIndex) =>
    clockIndex === index ? { ...clock, zone } : clock,
  );
}

function addClock() {
  if (savedClocks.value.length >= 6) return;
  const unused = zoneOptions.find(
    (option) => !savedClocks.value.some((clock) => clock.zone === option.value),
  );
  savedClocks.value = [
    ...savedClocks.value,
    {
      id: globalThis.crypto?.randomUUID?.() ?? `clock-${Date.now()}`,
      zone: unused?.value ?? "UTC",
    },
  ];
}

function removeClock(id: string) {
  if (savedClocks.value.length === 1) return;
  savedClocks.value = savedClocks.value.filter((clock) => clock.id !== id);
}

function copyClock(clock: (typeof clocks.value)[number]) {
  copyText(`${clock.label}: ${clock.time}, ${clock.date} (${clock.offset})`);
}
</script>

<template>
  <ToolWorkbench
    description="Compare important time zones at a glance. Your selections stay on this device."
  >
    <div class="grid gap-5">
      <div class="border-muted flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 class="text-highlighted text-base font-semibold">Your clocks</h2>
          <p class="text-muted mt-1 text-sm">Add up to 6 zones. Changes save automatically.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div
            class="bg-muted flex rounded-md p-1"
            aria-label="Time format"
          >
            <UButton
              label="12 hour"
              color="neutral"
              :variant="timeFormat === '12' ? 'soft' : 'ghost'"
              size="sm"
              :aria-pressed="timeFormat === '12'"
              @click="timeFormat = '12'"
            />
            <UButton
              label="24 hour"
              color="neutral"
              :variant="timeFormat === '24' ? 'soft' : 'ghost'"
              size="sm"
              :aria-pressed="timeFormat === '24'"
              @click="timeFormat = '24'"
            />
          </div>
          <UButton
            label="Add clock"
            icon="i-tabler-plus"
            color="neutral"
            variant="outline"
            :disabled="savedClocks.length >= 6"
            @click="addClock"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <section
          v-for="(clock, index) in clocks"
          :key="clock.id"
          class="border-muted bg-muted/30 overflow-hidden rounded-lg border"
        >
          <header class="border-muted bg-elevated border-b p-4 sm:p-5">
            <div class="flex items-end gap-3">
              <UFormField
                :label="`Clock ${index + 1}`"
                class="min-w-0 flex-1"
              >
                <USelectMenu
                  :model-value="clock.zone"
                  :items="zoneOptions"
                  value-key="value"
                  label-key="label"
                  size="lg"
                  :search-input="{ placeholder: 'Search time zones...' }"
                  class="w-full"
                  @update:model-value="updateZone(index, $event)"
                />
              </UFormField>
              <UButton
                icon="i-tabler-trash"
                aria-label="Remove clock"
                color="neutral"
                variant="ghost"
                :disabled="clocks.length === 1"
                class="mb-0.5 shrink-0"
                @click="removeClock(clock.id)"
              />
            </div>
          </header>

          <div class="p-5 sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-toned text-sm font-medium">{{ clock.label }}</p>
                <p
                  class="text-highlighted mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
                >
                  {{ clock.time || "--:--:--" }}
                </p>
              </div>
              <UButton
                color="neutral"
                variant="soft"
                icon="i-tabler-copy"
                aria-label="Copy clock time"
                size="sm"
                @click="copyClock(clock)"
              />
            </div>
            <div
              class="border-muted mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
            >
              <p class="text-muted text-sm">{{ clock.date || "Loading local clock" }}</p>
              <p class="text-dimmed font-mono text-xs">{{ clock.offset }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </ToolWorkbench>
</template>
