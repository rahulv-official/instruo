<script setup lang="ts">
const input = ref("");
const { copyText } = useCopyToClipboard();

const output = computed(() => formatSql(input.value));

function formatSql(value: string) {
  if (!value.trim()) return "";

  const keywords =
    /\b(select|from|where|group by|order by|having|limit|offset|left join|right join|inner join|full join|join|union)\b/gi;
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",\n  ")
    .replace(keywords, (keyword) => `\n${keyword.toUpperCase()}`)
    .replace(/\s+(AND|OR)\s+/gi, "\n  $1 ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
</script>

<template>
  <ToolWorkbench
    description="Format common SQL clauses locally with readable line breaks and indentation."
  >
    <div class="grid gap-6 lg:grid-cols-2">
      <UFormField label="SQL input">
        <UTextarea
          v-model="input"
          autoresize
          :rows="14"
          :maxrows="24"
          class="w-full"
          placeholder="select id, name from users where active = true order by name;"
          :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
        />
      </UFormField>
      <UFormField label="Formatted SQL">
        <UTextarea
          :model-value="output"
          readonly
          autoresize
          :rows="14"
          :maxrows="24"
          class="w-full"
          placeholder="Formatted query appears here."
          :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
        />
      </UFormField>
    </div>
    <div class="mt-5 flex justify-end">
      <UButton
        label="Copy SQL"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        :disabled="!output"
        @click="copyText(output)"
      />
    </div>
  </ToolWorkbench>
</template>
