<script setup lang="ts">
const start = ref(new Date().toISOString().slice(0, 16));
const end = ref(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
const duration = computed(() => {
  const milliseconds = new Date(end.value).getTime() - new Date(start.value).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "End must be after start.";
  const minutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remaining = minutes % 60;
  return `${days} days · ${hours} hours · ${remaining} minutes`;
});
</script>

<template>
  <ToolWorkbench description="Find the exact calendar duration between two date and time values.">
    <div class="grid max-w-2xl gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Start"
          ><UInput
            v-model="start"
            type="datetime-local"
        /></UFormField>
        <UFormField label="End"
          ><UInput
            v-model="end"
            type="datetime-local"
        /></UFormField>
      </div>
      <UAlert
        color="primary"
        variant="subtle"
        title="Duration"
        :description="duration"
      />
    </div>
  </ToolWorkbench>
</template>
