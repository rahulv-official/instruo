<script setup lang="ts">
const input = ref("");

const statistics = computed(() => {
  const trimmed = input.value.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).length : 0;

  return [
    { label: "Words", value: words },
    { label: "Characters", value: input.value.length },
    { label: "Without spaces", value: input.value.replace(/\s/g, "").length },
    { label: "Lines", value: input.value ? input.value.split(/\r?\n/).length : 0 },
    { label: "Sentences", value: sentences },
    {
      label: "Reading time",
      value: words ? `${Math.max(1, Math.ceil(words / 200))} min` : "0 min",
    },
  ];
});
</script>

<template>
  <ToolWorkbench description="Every count updates as you type.">
    <div class="grid gap-6">
      <UFormField label="Text to count">
        <UTextarea
          v-model="input"
          placeholder="Type or paste text…"
          autoresize
          :rows="12"
          :maxrows="20"
          class="w-full"
          :ui="{ base: 'rounded-none text-base leading-7' }"
        />
      </UFormField>

      <dl class="border-default/70 grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="statistic in statistics"
          :key="statistic.label"
          class="border-default/70 border-r border-b p-5"
        >
          <dt class="text-muted text-sm">{{ statistic.label }}</dt>
          <dd class="text-highlighted mt-3 font-mono text-3xl tabular-nums">
            {{ statistic.value }}
          </dd>
        </div>
      </dl>
    </div>
  </ToolWorkbench>
</template>
