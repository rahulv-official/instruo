<script setup lang="ts">
const algorithm = ref("SHA-256");
const first = ref("");
const second = ref("");
const output = ref("");
async function compare() {
  const [a, b] = await Promise.all([
    crypto.subtle.digest(algorithm.value, new TextEncoder().encode(first.value)),
    crypto.subtle.digest(algorithm.value, new TextEncoder().encode(second.value)),
  ]);
  output.value = JSON.stringify(
    {
      equal: Array.from(new Uint8Array(a)).join(",") === Array.from(new Uint8Array(b)).join(","),
      algorithm: algorithm.value,
    },
    null,
    2,
  );
}
</script>
<template>
  <ToolWorkbench description="Compare two strings with a browser cryptographic digest."
    ><div class="grid gap-5">
      <USelect
        v-model="algorithm"
        :items="['SHA-256', 'SHA-384', 'SHA-512']"
        class="w-full sm:max-w-xs"
      />
      <div class="grid gap-5 lg:grid-cols-2">
        <UTextarea
          v-model="first"
          :rows="7"
          placeholder="First value"
        /><UTextarea
          v-model="second"
          :rows="7"
          placeholder="Second value"
        />
      </div>
      <UButton
        label="Compare values"
        icon="i-lucide-git-compare"
        class="w-fit"
        @click="compare"
      /><UTextarea
        v-model="output"
        :rows="4"
        readonly
        class="font-mono"
      /></div
  ></ToolWorkbench>
</template>
