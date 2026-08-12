<script setup lang="ts">
const input = ref("");
const result = computed(() => {
  if (!input.value.trim()) return { header: "", payload: "", error: "" };
  const parts = input.value.trim().split(".");
  if (parts.length !== 3)
    return { header: "", payload: "", error: "JWT must have three dot-separated parts." };
  try {
    return { header: prettyDecode(parts[0]!), payload: prettyDecode(parts[1]!), error: "" };
  } catch {
    return { header: "", payload: "", error: "Header or payload is not valid Base64URL JSON." };
  }
});
function prettyDecode(value: string) {
  const bytes = Uint8Array.from(
    atob(
      value
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(value.length / 4) * 4, "="),
    ),
    (char) => char.charCodeAt(0),
  );
  return JSON.stringify(JSON.parse(new TextDecoder().decode(bytes)), null, 2);
}
</script>

<template>
  <ToolWorkbench
    description="Decode JWT header and payload locally. This does not verify signatures."
  >
    <div class="grid gap-6">
      <UFormField
        label="JWT"
        description="Never paste a production token into a shared or untrusted device."
        :error="result.error || undefined"
      >
        <UTextarea
          v-model="input"
          autoresize
          :rows="6"
          class="w-full font-mono"
          placeholder="eyJhbGciOi..."
        />
      </UFormField>
      <div class="grid gap-4 lg:grid-cols-2">
        <UFormField label="Header">
          <UTextarea
            :model-value="result.header"
            readonly
            :rows="8"
            class="w-full font-mono"
            placeholder="Decoded header appears here."
          /> </UFormField
        ><UFormField label="Payload">
          <UTextarea
            :model-value="result.payload"
            readonly
            :rows="8"
            class="w-full font-mono"
            placeholder="Decoded payload appears here."
          />
        </UFormField>
      </div>
    </div>
  </ToolWorkbench>
</template>
