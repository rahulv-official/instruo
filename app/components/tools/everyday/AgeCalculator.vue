<script setup lang="ts">
const birthDate = ref("1990-01-01");
const today = ref(new Date().toISOString().slice(0, 10));
const age = computed(() => {
  const birth = new Date(`${birthDate.value}T00:00:00`);
  const now = new Date(`${today.value}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(now.getTime()) || now < birth)
    return "Choose a valid birth date.";
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} years, ${months} months`;
});
</script>

<template>
  <ToolWorkbench description="Calculate an age from two dates without sending them anywhere.">
    <div class="grid max-w-xl gap-5 sm:grid-cols-2">
      <UFormField label="Birth date"
        ><UInput
          v-model="birthDate"
          type="date"
      /></UFormField>
      <UFormField label="As of"
        ><UInput
          v-model="today"
          type="date"
      /></UFormField>
      <UAlert
        class="sm:col-span-2"
        color="primary"
        variant="subtle"
        title="Age"
        :description="age"
      />
    </div>
  </ToolWorkbench>
</template>
