<script setup lang="ts">
import { copyBrowserText } from "~/utils/browser-tools";
const output = ref("");
const loading = ref(false);
function pem(label: string, value: ArrayBuffer) {
  const body =
    btoa(String.fromCharCode(...new Uint8Array(value)))
      .match(/.{1,64}/g)
      ?.join("\n") ?? "";
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}
async function generate() {
  loading.value = true;
  try {
    const pair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );
    output.value = `${pem("PUBLIC KEY", await crypto.subtle.exportKey("spki", pair.publicKey))}\n\n${pem("PRIVATE KEY", await crypto.subtle.exportKey("pkcs8", pair.privateKey))}`;
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <ToolWorkbench description="Generate an RSA-OAEP 2048-bit public and private key pair locally."
    ><div class="grid gap-5">
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Generate key pair"
          icon="i-lucide-key-round"
          :loading="loading"
          @click="generate"
        /><UButton
          label="Copy keys"
          color="neutral"
          variant="outline"
          :disabled="!output"
          @click="copyBrowserText(output)"
        />
      </div>
      <UTextarea
        v-model="output"
        :rows="20"
        readonly
        class="font-mono text-xs"
        placeholder="PEM keys appear here."
      /></div
  ></ToolWorkbench>
</template>
