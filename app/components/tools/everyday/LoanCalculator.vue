<script setup lang="ts">
const principal = ref(250000);
const annualRate = ref(7.5);
const months = ref(60);
const monthly = computed(() => {
  const p = Number(principal.value) || 0;
  const n = Math.max(1, Number(months.value) || 1);
  const r = (Number(annualRate.value) || 0) / 1200;
  return r === 0 ? p / n : (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
});
const total = computed(() => monthly.value * Math.max(1, Number(months.value) || 1));
const format = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
</script>

<template>
  <ToolWorkbench description="Estimate monthly loan payments and total repayment locally.">
    <div class="grid max-w-2xl gap-5">
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Loan amount"
          ><UInput
            v-model.number="principal"
            type="number"
            min="0"
        /></UFormField>
        <UFormField label="Annual rate (%)"
          ><UInput
            v-model.number="annualRate"
            type="number"
            min="0"
            step="0.01"
        /></UFormField>
        <UFormField label="Term (months)"
          ><UInput
            v-model.number="months"
            type="number"
            min="1"
        /></UFormField>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <UAlert
          color="primary"
          variant="subtle"
          title="Estimated monthly payment"
          :description="format(monthly)"
        />
        <UAlert
          color="neutral"
          variant="subtle"
          title="Total repayment"
          :description="format(total)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
