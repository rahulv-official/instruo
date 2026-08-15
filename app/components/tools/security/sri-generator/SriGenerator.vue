<script setup lang="ts">
type Algorithm = "SHA-256" | "SHA-384" | "SHA-512";
const content = ref("console.log('hello');");
const algorithm = ref<Algorithm>("SHA-384");
const output = ref("");
const status = ref("");
const { copyText } = useCopyToClipboard();
const algorithms = ["SHA-256", "SHA-384", "SHA-512"];

function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
async function generate() {
  try {
    const digest = await crypto.subtle.digest(
      algorithm.value,
      new TextEncoder().encode(content.value),
    );
    output.value = `${algorithm.value.toLowerCase().replace("sha-", "sha")}-${base64(new Uint8Array(digest))}`;
    status.value = "Integrity value generated locally.";
  } catch {
    output.value = "";
    status.value = "Web Crypto is unavailable in this browser.";
  }
}
</script>

<template>
  <ToolWorkbench
    description="Generate Subresource Integrity values for scripts and styles without uploading content."
  >
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <UFormField label="Algorithm">
          <USelect
            v-model="algorithm"
            :items="algorithms"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Resource content">
          <UTextarea
            v-model="content"
            :rows="8"
            class="w-full font-mono"
          />
        </UFormField>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Generate hash"
          icon="i-tabler-hash"
          @click="generate"
        />
        <UButton
          label="Copy integrity"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
      <UFormField label="integrity value">
        <UInput
          v-model="output"
          readonly
          class="w-full font-mono"
          placeholder="sha384-…"
        />
      </UFormField>
      <p
        v-if="status"
        class="text-muted text-sm"
        role="status"
      >
        {{ status }}
      </p>
    </div>
  </ToolWorkbench>
</template>
