<script setup lang="ts">
const bill = ref(80);
const tipPercent = ref(18);
const people = ref(2);
const tip = computed(() => ((Number(bill.value) || 0) * (Number(tipPercent.value) || 0)) / 100);
const perPerson = computed(
  () => (Number(bill.value) + tip.value) / Math.max(1, Number(people.value) || 1),
);
const money = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });
</script>

<template>
  <ToolWorkbench description="Split a bill and tip fairly across your group.">
    <div class="grid max-w-2xl gap-5">
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Bill total"
          ><UInput
            v-model.number="bill"
            type="number"
            min="0"
        /></UFormField>
        <UFormField label="Tip (%)"
          ><UInput
            v-model.number="tipPercent"
            type="number"
            min="0"
        /></UFormField>
        <UFormField label="People"
          ><UInput
            v-model.number="people"
            type="number"
            min="1"
            step="1"
        /></UFormField>
      </div>
      <UAlert
        color="primary"
        variant="subtle"
        title="Per person"
        :description="money(perPerson)"
      />
      <p class="text-muted text-sm">
        Tip: {{ money(tip) }} · Total: {{ money(Number(bill) + tip) }}
      </p>
    </div>
  </ToolWorkbench>
</template>
