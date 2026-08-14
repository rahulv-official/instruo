<script setup lang="ts">
const principal = ref(10000);
const contribution = ref(250);
const rate = ref(7);
const years = ref(10);
const frequency = ref(12);
function balanceAt(periods: number) {
  const periodicRate = rate.value / 100 / frequency.value;
  if (periodicRate === 0) return principal.value + contribution.value * periods;
  const growth = (1 + periodicRate) ** periods;
  return (
    principal.value * growth +
    contribution.value * ((growth - 1) / Math.max(periodicRate, 0.0000001))
  );
}
const futureValue = computed(() => balanceAt(Math.max(1, years.value * frequency.value)));
const contributed = computed(
  () => principal.value + contribution.value * years.value * frequency.value,
);
const interest = computed(() => Math.max(0, futureValue.value - contributed.value));
const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const rows = computed(() =>
  Array.from({ length: Math.min(50, Math.max(1, Math.floor(years.value))) }, (_, index) => {
    const elapsed = index + 1;
    const periods = elapsed * frequency.value;
    return { year: elapsed, value: balanceAt(periods) };
  }),
);
</script>

<template>
  <ToolWorkbench
    description="Estimate compound growth with recurring contributions, entirely in your browser."
  >
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Starting balance">
          <UInput
            v-model.number="principal"
            type="number"
            min="0"
          />
        </UFormField>
        <UFormField label="Recurring contribution">
          <UInput
            v-model.number="contribution"
            type="number"
            min="0"
          />
        </UFormField>
        <UFormField label="Annual return (%)">
          <UInput
            v-model.number="rate"
            type="number"
            min="0"
            step="0.1"
          />
        </UFormField>
        <UFormField label="Years">
          <UInput
            v-model.number="years"
            type="number"
            min="1"
            max="50"
          />
        </UFormField>
        <UFormField label="Compounds per year">
          <USelect
            v-model="frequency"
            :items="[
              { label: 'Monthly', value: 12 },
              { label: 'Quarterly', value: 4 },
              { label: 'Annually', value: 1 },
            ]"
            value-key="value"
            label-key="label"
          />
        </UFormField>
      </div>
      <div class="border-default bg-elevated grid gap-4 border p-5">
        <div>
          <p class="text-muted text-sm">Estimated balance</p>
          <p class="text-highlighted text-4xl font-semibold">{{ money.format(futureValue) }}</p>
        </div>
        <div class="grid gap-1 text-sm">
          <span class="text-muted"
            >Contributions
            <strong class="text-highlighted">{{ money.format(contributed) }}</strong></span
          ><span class="text-muted"
            >Growth <strong class="text-highlighted">{{ money.format(interest) }}</strong></span
          >
        </div>
      </div>
    </div>
    <div class="mt-6 grid gap-2">
      <p class="text-highlighted text-sm font-medium">Year-by-year estimate</p>
      <div
        v-for="row in rows"
        :key="row.year"
        class="border-default flex justify-between border-b py-2 text-sm"
      >
        <span class="text-muted">Year {{ row.year }}</span
        ><span class="text-highlighted font-mono">{{ money.format(row.value) }}</span>
      </div>
    </div>
    <p class="text-muted mt-5 text-xs">
      Illustrative math only; actual returns, fees, taxes, and compounding rules vary.
    </p>
  </ToolWorkbench>
</template>
