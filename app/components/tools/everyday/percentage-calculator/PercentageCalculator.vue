<script setup lang="ts">
const value = ref(100);
const percent = ref(15);
const result = computed(() => ((Number(value.value) || 0) * (Number(percent.value) || 0)) / 100);
</script>

<template>
  <ToolWorkbench description="Calculate a percentage of any number without leaving the page.">
    <div class="grid max-w-xl gap-5 sm:grid-cols-2">
      <UFormField label="Number">
        <UInput
          v-model.number="value"
          type="number"
        />
      </UFormField>
      <UFormField label="Percentage">
        <UInput
          v-model.number="percent"
          type="number"
        />
      </UFormField>
      <UAlert
        class="sm:col-span-2"
        color="primary"
        variant="subtle"
        title="Answer"
        :description="`${percent}% of ${value} = ${result}`"
      />
    </div>
  </ToolWorkbench>
</template>
