<script setup lang="ts">
type Category = "length" | "weight" | "temperature";
const category = ref<Category>("length");
const amount = ref(1);
const fromUnit = ref("meter");
const toUnit = ref("foot");
const unitSets: Record<Category, string[]> = {
  length: ["meter", "kilometer", "centimeter", "inch", "foot", "mile"],
  weight: ["kilogram", "gram", "pound", "ounce"],
  temperature: ["celsius", "fahrenheit", "kelvin"],
};
const units = computed(() => unitSets[category.value]);
const sourceUnit = computed(() =>
  units.value.includes(fromUnit.value) ? fromUnit.value : (units.value[0] ?? ""),
);
const targetUnit = computed(() =>
  units.value.includes(toUnit.value) ? toUnit.value : (units.value[1] ?? units.value[0] ?? ""),
);
const fromSelection = computed({
  get: () => sourceUnit.value,
  set: (value: string) => {
    fromUnit.value = value;
  },
});
const toSelection = computed({
  get: () => targetUnit.value,
  set: (value: string) => {
    toUnit.value = value;
  },
});
function toBase(value: number, unit: string) {
  if (category.value === "temperature")
    return unit === "fahrenheit"
      ? ((value - 32) * 5) / 9
      : unit === "kelvin"
        ? value - 273.15
        : value;
  const factors: Record<string, number> = {
    meter: 1,
    kilometer: 1000,
    centimeter: 0.01,
    inch: 0.0254,
    foot: 0.3048,
    mile: 1609.344,
    kilogram: 1,
    gram: 0.001,
    pound: 0.45359237,
    ounce: 0.0283495,
  };
  return value * (factors[unit] ?? 1);
}
function fromBase(value: number, unit: string) {
  if (category.value === "temperature")
    return unit === "fahrenheit"
      ? (value * 9) / 5 + 32
      : unit === "kelvin"
        ? value + 273.15
        : value;
  const factors: Record<string, number> = {
    meter: 1,
    kilometer: 1000,
    centimeter: 0.01,
    inch: 0.0254,
    foot: 0.3048,
    mile: 1609.344,
    kilogram: 1,
    gram: 0.001,
    pound: 0.45359237,
    ounce: 0.0283495,
  };
  return value / (factors[unit] ?? 1);
}
const result = computed(() =>
  fromBase(toBase(Number(amount.value) || 0, sourceUnit.value), targetUnit.value).toLocaleString(
    undefined,
    { maximumFractionDigits: 8 },
  ),
);
</script>

<template>
  <ToolWorkbench description="Convert everyday measurements with instant browser-side results.">
    <div class="grid max-w-4xl gap-7">
      <div class="grid items-end gap-5 sm:grid-cols-[minmax(0,1.6fr)_auto_minmax(12rem,1fr)]">
        <div class="grid gap-5">
          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.85fr)]">
            <UFormField
              label="Category"
              class="w-full"
            >
              <USelect
                v-model="category"
                :items="[
                  { label: 'Length', value: 'length' },
                  { label: 'Weight', value: 'weight' },
                  { label: 'Temperature', value: 'temperature' },
                ]"
                class="w-full"
                value-key="value"
                label-key="label"
              />
            </UFormField>
            <div
              class="hidden sm:block"
              aria-hidden="true"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.85fr)]">
            <UFormField label="Amount">
              <UInput
                v-model.number="amount"
                type="number"
                min="0"
                inputmode="decimal"
                class="w-full"
              />
            </UFormField>
            <UFormField label="From">
              <USelect
                v-model="fromSelection"
                :items="units"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <div
          class="text-muted hidden items-center justify-center pb-2 sm:flex"
          aria-hidden="true"
        >
          <Icon
            name="tabler:arrow-right"
            class="size-5"
          />
        </div>

        <UFormField label="To">
          <USelect
            v-model="toSelection"
            :items="units"
            class="w-full"
          />
        </UFormField>
      </div>

      <div
        class="border-muted bg-muted/35 rounded-md border px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6"
      >
        <div>
          <p class="text-muted text-sm font-medium">Result</p>
          <p class="text-highlighted mt-1 font-mono text-xl font-semibold tracking-tight">
            {{ result }} {{ targetUnit }}
          </p>
        </div>
        <p class="text-dimmed mt-2 text-sm sm:mt-0">
          {{ amount || 0 }} {{ sourceUnit }} converted locally
        </p>
      </div>
    </div>
  </ToolWorkbench>
</template>
