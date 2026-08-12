<script setup lang="ts">
const left = ref("");
const right = ref("");
const rows = computed(() => {
  const a = left.value.split(/\r?\n/);
  const b = right.value.split(/\r?\n/);
  const length = Math.max(a.length, b.length);
  return Array.from({ length }, (_, index) => ({
    left: a[index] ?? "",
    right: b[index] ?? "",
    type: a[index] === b[index] ? "same" : !a[index] ? "added" : !b[index] ? "removed" : "changed",
  }));
});
</script>

<template>
  <ToolWorkbench description="Compare two short text blocks line by line in your browser.">
    <div class="grid gap-6">
      <div class="grid gap-4 lg:grid-cols-2">
        <UFormField label="Original">
          <UTextarea
            v-model="left"
            autoresize
            :rows="10"
            class="w-full font-mono"
          />
        </UFormField><UFormField label="Updated">
          <UTextarea
            v-model="right"
            autoresize
            :rows="10"
            class="w-full font-mono"
          />
        </UFormField>
      </div>
      <ol class="border-default/70 border-t font-mono text-sm">
        <li
          v-for="(row, index) in rows"
          :key="index"
          class="border-default/70 grid gap-2 border-b px-3 py-2 sm:grid-cols-2"
          :class="
            row.type === 'same'
              ? 'text-muted'
              : row.type === 'added'
                ? 'text-success bg-success/5'
                : row.type === 'removed'
                  ? 'text-error bg-error/5'
                  : 'text-warning bg-warning/5'
          "
        >
          <span>{{ row.left || "∅" }}</span><span>{{ row.right || "∅" }}</span>
        </li>
      </ol>
    </div>
  </ToolWorkbench>
</template>
