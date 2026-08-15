<script setup lang="ts">
type TimestampUnit = "milliseconds" | "seconds";

const unitItems: { label: string; value: TimestampUnit }[] = [
  { label: "Seconds", value: "seconds" },
  { label: "Milliseconds", value: "milliseconds" },
];

const timestampInput = ref("");
const timestampUnit = ref<TimestampUnit>("seconds");
const dateInput = ref("");
const { copyText } = useCopyToClipboard();

const timestampDate = computed(() => {
  const value = Number(timestampInput.value);
  if (!timestampInput.value.trim() || !Number.isFinite(value)) return null;
  const date = new Date(timestampUnit.value === "seconds" ? value * 1_000 : value);
  return Number.isNaN(date.getTime()) ? null : date;
});

const timestampResult = computed(() => {
  const date = timestampDate.value;
  if (!date) return null;
  return {
    iso: date.toISOString(),
    local: date.toLocaleString(),
    utc: date.toUTCString(),
  };
});

const dateResult = computed(() => {
  if (!dateInput.value) return null;
  const date = new Date(dateInput.value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    milliseconds: String(date.getTime()),
    seconds: String(Math.floor(date.getTime() / 1_000)),
  };
});

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function useCurrentTime() {
  const now = new Date();
  timestampInput.value = String(
    timestampUnit.value === "seconds" ? Math.floor(now.getTime() / 1_000) : now.getTime(),
  );
  dateInput.value = localDateTimeValue(now);
}

function setUnit(value: string | undefined) {
  if (value !== "seconds" && value !== "milliseconds") return;
  const currentDate = timestampDate.value;
  timestampUnit.value = value;
  if (!currentDate) return;
  timestampInput.value = String(
    value === "seconds" ? Math.floor(currentDate.getTime() / 1_000) : currentDate.getTime(),
  );
}

onMounted(useCurrentTime);
</script>

<template>
  <ToolWorkbench
    description="Convert Unix timestamps and local date-time values in both directions."
  >
    <div class="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <section class="grid content-start gap-5">
        <div>
          <p class="text-highlighted font-semibold">Timestamp to date</p>
          <p class="text-muted mt-1 text-sm leading-6">
            Read a Unix timestamp in seconds or milliseconds.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <UFormField
            label="Timestamp"
            :error="
              timestampInput && !timestampResult ? 'Enter a valid Unix timestamp.' : undefined
            "
            :ui="{ container: 'mt-2' }"
          >
            <UInput
              v-model="timestampInput"
              inputmode="numeric"
              placeholder="1710000000"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Unit"
            :ui="{ container: 'mt-2' }"
          >
            <USelect
              :model-value="timestampUnit"
              :items="unitItems"
              value-key="value"
              label-key="label"
              size="lg"
              class="w-full"
              :ui="{ base: 'rounded-md', content: 'rounded-md', item: 'before:rounded-md' }"
              @update:model-value="setUnit"
            />
          </UFormField>
        </div>

        <dl class="border-default/70 divide-default/70 divide-y border-y">
          <div class="grid gap-1 py-4">
            <dt class="text-toned text-xs">ISO 8601</dt>
            <dd class="text-highlighted font-mono text-sm break-all">
              {{ timestampResult?.iso || "Waiting for a valid timestamp." }}
            </dd>
          </div>
          <div class="grid gap-1 py-4">
            <dt class="text-toned text-xs">Local time</dt>
            <dd class="text-highlighted font-mono text-sm">
              {{ timestampResult?.local || "Not available" }}
            </dd>
          </div>
          <div class="grid gap-1 py-4">
            <dt class="text-toned text-xs">UTC</dt>
            <dd class="text-highlighted font-mono text-sm">
              {{ timestampResult?.utc || "Not available" }}
            </dd>
          </div>
        </dl>

        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            label="Use current time"
            color="neutral"
            variant="ghost"
            icon="i-tabler-clock"
            @click="useCurrentTime"
          />
          <UButton
            color="neutral"
            variant="soft"
            label="Copy ISO time"
            icon="i-tabler-copy"
            :disabled="!timestampResult"
            @click="copyText(timestampResult?.iso || '')"
          />
        </div>
      </section>

      <section
        class="border-default/70 grid content-start gap-5 border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
      >
        <div>
          <p class="text-highlighted font-semibold">Date to timestamp</p>
          <p class="text-muted mt-1 text-sm leading-6">
            The selected value is interpreted in your local time zone.
          </p>
        </div>

        <UFormField
          label="Local date and time"
          :error="dateInput && !dateResult ? 'Choose a valid date and time.' : undefined"
          :ui="{ container: 'mt-2' }"
        >
          <UInput
            v-model="dateInput"
            type="datetime-local"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <dl class="border-default/70 divide-default/70 divide-y border-y">
          <div class="grid gap-1 py-4">
            <dt class="text-toned text-xs">Seconds</dt>
            <dd class="text-highlighted font-mono text-lg tabular-nums">
              {{ dateResult?.seconds || "Not available" }}
            </dd>
          </div>
          <div class="grid gap-1 py-4">
            <dt class="text-toned text-xs">Milliseconds</dt>
            <dd class="text-highlighted font-mono text-lg tabular-nums">
              {{ dateResult?.milliseconds || "Not available" }}
            </dd>
          </div>
        </dl>

        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="soft"
            label="Copy seconds"
            icon="i-tabler-copy"
            :disabled="!dateResult"
            @click="copyText(dateResult?.seconds || '')"
          />
        </div>
      </section>
    </div>
  </ToolWorkbench>
</template>
