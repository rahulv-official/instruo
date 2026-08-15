<script setup lang="ts">
interface Row {
  key: string;
  value: string;
}
const rows = ref<Row[]>([{ key: "", value: "" }]);
const query = computed(() =>
  new URLSearchParams(
    rows.value.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]),
  ).toString(),
);
function addRow() {
  rows.value = [...rows.value, { key: "", value: "" }];
}
function removeRow(index: number) {
  rows.value =
    rows.value.length === 1
      ? [{ key: "", value: "" }]
      : rows.value.filter((_, rowIndex) => rowIndex !== index);
}
</script>

<template>
  <ToolWorkbench description="Build an encoded query string from key and value pairs.">
    <div class="mx-auto grid max-w-2xl gap-5">
      <div
        v-for="(row, index) in rows"
        :key="index"
        class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
      >
        <UInput
          v-model="row.key"
          placeholder="Key"
          aria-label="Query key"
        /><UInput
          v-model="row.value"
          placeholder="Value"
          aria-label="Query value"
        /><UButton
          icon="i-tabler-x"
          color="neutral"
          variant="ghost"
          aria-label="Remove row"
          @click="removeRow(index)"
        />
      </div>
      <div class="flex justify-between gap-4">
        <UButton
          label="Add parameter"
          color="neutral"
          variant="outline"
          icon="i-tabler-plus"
          @click="addRow"
        /><code class="border-default/70 min-w-0 rounded-md border p-3 text-sm break-all">{{
          query || "query=values"
        }}</code>
      </div>
    </div>
  </ToolWorkbench>
</template>
