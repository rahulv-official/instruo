<script setup lang="ts">
const algorithm = ref("SHA-256");
const mode = ref<"values" | "hash">("values");
const first = ref("");
const second = ref("");
const output = ref("");
async function compare() {
  const firstDigest = await crypto.subtle.digest(
    algorithm.value,
    new TextEncoder().encode(first.value),
  );
  const firstHex = Array.from(new Uint8Array(firstDigest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (mode.value === "hash") {
    const expected = second.value.trim().toLowerCase().replace(/^0x/, "");
    output.value = JSON.stringify(
      { equal: firstHex === expected, algorithm: algorithm.value, digest: firstHex, expected },
      null,
      2,
    );
    return;
  }
  const secondDigest = await crypto.subtle.digest(
    algorithm.value,
    new TextEncoder().encode(second.value),
  );
  const secondHex = Array.from(new Uint8Array(secondDigest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  output.value = JSON.stringify(
    {
      equal: firstHex === secondHex,
      algorithm: algorithm.value,
      firstDigest: firstHex,
      secondDigest: secondHex,
    },
    null,
    2,
  );
}
</script>
<template>
  <ToolWorkbench description="Compare two strings with a browser cryptographic digest.">
    <div class="grid gap-5">
      <UFormField label="Comparison mode">
        <USelect
          v-model="mode"
          :items="[
            { label: 'Compare two values', value: 'values' },
            { label: 'Verify a value against a hash', value: 'hash' },
          ]"
          class="w-full sm:max-w-xs"
        />
      </UFormField>
      <UFormField label="Digest algorithm">
        <USelect
          v-model="algorithm"
          :items="['SHA-256', 'SHA-384', 'SHA-512']"
          class="w-full sm:max-w-xs"
        />
      </UFormField>
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Value to hash">
          <UTextarea
            v-model="first"
            :rows="7"
            placeholder="Paste a value"
          />
        </UFormField>
        <UFormField :label="mode === 'hash' ? 'Expected hexadecimal hash' : 'Second value'">
          <UTextarea
            v-model="second"
            :rows="7"
            :placeholder="mode === 'hash' ? 'e3b0c442…' : 'Paste a second value'"
          />
        </UFormField>
      </div>
      <UButton
        label="Compare values"
        icon="i-tabler-git-compare"
        class="w-fit"
        @click="compare"
      /><UTextarea
        v-model="output"
        :rows="4"
        readonly
        class="font-mono"
      />
    </div>
  </ToolWorkbench>
</template>
