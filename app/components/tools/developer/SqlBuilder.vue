<script setup lang="ts">
const table = ref("users");
const columns = ref("id, name, email");
const where = ref("");
const order = ref("");
const limit = ref("50");
const query = computed(
  () =>
    `SELECT ${columns.value || "*"}\nFROM ${table.value || "table"}${where.value ? `\nWHERE ${where.value}` : ""}${order.value ? `\nORDER BY ${order.value}` : ""}${limit.value ? `\nLIMIT ${limit.value}` : ""};`,
);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Compose a readable SELECT query with filters, ordering, and a limit."
    ><div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Table"><UInput v-model="table" /></UFormField
        ><UFormField label="Columns"><UInput v-model="columns" /></UFormField
        ><UFormField label="Where"
          ><UInput
            v-model="where"
            placeholder="active = true" /></UFormField
        ><UFormField label="Order by"
          ><UInput
            v-model="order"
            placeholder="created_at DESC" /></UFormField
        ><UFormField label="Limit"
          ><UInput
            v-model="limit"
            type="number"
        /></UFormField>
      </div>
      <UTextarea
        :model-value="query"
        :rows="7"
        readonly
        class="font-mono"
      />
      <div class="flex justify-end">
        <UButton
          label="Copy SQL"
          icon="i-lucide-copy"
          @click="copyText(query)"
        />
      </div></div
  ></ToolWorkbench>
</template>
