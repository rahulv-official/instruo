<script setup lang="ts">
const input = ref("");
const output = ref("");
async function inspect() {
  const match = input.value.match(/-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/);
  if (!match) {
    output.value = "No PEM block found.";
    return;
  }
  const bytes = Uint8Array.from(atob(match[2]!.replace(/\s/g, "")), (char) => char.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  output.value = JSON.stringify(
    {
      type: match[1],
      bytes: bytes.length,
      sha256: Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
      ),
    },
    null,
    2,
  );
}
</script>
<template>
  <ToolWorkbench
    description="Read a PEM envelope and calculate a local SHA-256 fingerprint. This tool does not parse certificate fields."
  >
    <div class="grid gap-5">
      <UTextarea
        v-model="input"
        :rows="14"
        class="font-mono text-xs"
        placeholder="-----BEGIN CERTIFICATE-----"
      /><UButton
        label="Inspect PEM"
        icon="i-tabler-search"
        class="w-fit"
        @click="inspect"
      /><UTextarea
        v-model="output"
        :rows="6"
        readonly
        class="font-mono"
        placeholder="PEM type, byte length, and SHA-256 fingerprint appear here."
      />
    </div>
  </ToolWorkbench>
</template>
