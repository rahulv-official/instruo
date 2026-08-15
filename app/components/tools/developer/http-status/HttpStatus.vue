<script setup lang="ts">
const query = ref("");
const statuses = [
  [100, "Continue"],
  [200, "OK"],
  [201, "Created"],
  [204, "No Content"],
  [301, "Moved Permanently"],
  [304, "Not Modified"],
  [400, "Bad Request"],
  [401, "Unauthorized"],
  [403, "Forbidden"],
  [404, "Not Found"],
  [405, "Method Not Allowed"],
  [408, "Request Timeout"],
  [409, "Conflict"],
  [429, "Too Many Requests"],
  [500, "Internal Server Error"],
  [502, "Bad Gateway"],
  [503, "Service Unavailable"],
  [504, "Gateway Timeout"],
] as const;
const filtered = computed(() =>
  statuses.filter(([code, label]) =>
    `${code} ${label}`.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
</script>
<template>
  <ToolWorkbench description="Search common HTTP response codes by number or meaning.">
    <div class="grid gap-5">
      <UInput
        v-model="query"
        icon="i-tabler-search"
        placeholder="Search 404, forbidden, timeout…"
      />
      <dl class="border-default grid border-t border-l">
        <div
          v-for="[code, label] in filtered"
          :key="code"
          class="border-default grid grid-cols-[5rem_1fr] gap-4 border-r border-b p-4"
        >
          <dt class="font-mono font-semibold">{{ code }}</dt>
          <dd>{{ label }}</dd>
        </div>
      </dl>
    </div>
  </ToolWorkbench>
</template>
