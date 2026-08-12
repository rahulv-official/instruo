<script setup lang="ts">
function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
const verifier = ref("");
const challenge = ref("");
async function generate() {
  verifier.value = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  challenge.value = base64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier.value))),
  );
}
</script>
<template>
  <ToolWorkbench description="Generate an OAuth PKCE verifier and S256 challenge locally."
    ><div class="grid gap-5">
      <UButton
        label="Generate PKCE pair"
        icon="i-lucide-shield-check"
        class="w-fit"
        @click="generate"
      /><UFormField label="Code verifier"
        ><UInput
          v-model="verifier"
          readonly
          class="font-mono" /></UFormField
      ><UFormField label="S256 code challenge"
        ><UInput
          v-model="challenge"
          readonly
          class="font-mono"
      /></UFormField></div
  ></ToolWorkbench>
</template>
