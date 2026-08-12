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
    <div class="grid max-w-3xl gap-5">
      <UFormField label="Category"
        ><USelect
          v-model="category"
          :items="[
            { label: 'Length', value: 'length' },
            { label: 'Weight', value: 'weight' },
            { label: 'Temperature', value: 'temperature' },
          ]"
          value-key="value"
          label-key="label"
      /></UFormField>
      <div class="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <UFormField label="Amount"
          ><UInput
            v-model.number="amount"
            type="number"
            min="0"
        /></UFormField>
        <span class="text-muted pb-2 text-center">from</span>
        <UFormField label="Unit"
          ><USelect
            v-model="fromSelection"
            :items="units"
        /></UFormField>
        <span class="text-muted hidden pb-2 text-center sm:block">to</span>
        <UFormField
          label="Unit"
          class="sm:col-start-3"
          ><USelect
            v-model="toSelection"
            :items="units"
        /></UFormField>
      </div>
      <UAlert
        color="primary"
        variant="subtle"
        title="Result"
        :description="`${result} ${targetUnit}`"
      />
    </div>
  </ToolWorkbench>
</template>
