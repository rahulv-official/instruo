<script setup lang="ts">
function decode(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(normalized)));
}
const token = ref("");
const header = ref('{"alg":"none","typ":"JWT"}');
const payload = ref('{"sub":"demo"}');
const inspected = computed(() => {
  try {
    const [h, p] = token.value.split(".");
    return JSON.stringify(
      { header: JSON.parse(decode(h ?? "")), payload: JSON.parse(decode(p ?? "")) },
      null,
      2,
    );
  } catch {
    return token.value ? "Invalid JWT." : "";
  }
});
const encoded = computed(() => {
  const enc = (value: string) =>
    btoa(unescape(encodeURIComponent(value)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  try {
    return `${enc(header.value)}.${enc(payload.value)}.`;
  } catch {
    return "Invalid JSON.";
  }
});
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Inspect JWT claims or create an unsigned token-shaped value locally.">
    <div class="grid gap-5">
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-tabler-alert-triangle"
        title="Unsigned output"
        description="The generated value has an empty signature and is not authenticated. Never use it for access control or production credentials."
      />
      <UFormField label="JWT to inspect">
        <UTextarea
          v-model="token"
          :rows="5"
          placeholder="eyJ..."
        /> </UFormField
      ><UTextarea
        :model-value="inspected"
        :rows="6"
        readonly
        placeholder="Decoded header and payload appear here."
      />
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Header JSON">
          <UTextarea
            v-model="header"
            :rows="4"
          /> </UFormField
        ><UFormField label="Payload JSON">
          <UTextarea
            v-model="payload"
            :rows="4"
          />
        </UFormField>
      </div>
      <UTextarea
        :model-value="encoded"
        :rows="3"
        readonly
      />
      <div class="flex justify-end">
        <UButton
          color="neutral"
          variant="soft"
          label="Copy token-shaped value"
          icon="i-tabler-copy"
          @click="copyText(encoded)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
