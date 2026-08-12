<script setup lang="ts">
const password = ref("");
const input = ref("");
const output = ref("");
async function derive(salt: Uint8Array) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.value),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
function decode(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
async function encrypt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(salt);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(input.value),
  );
  output.value = JSON.stringify({
    salt: encode(salt),
    iv: encode(iv),
    data: encode(new Uint8Array(data)),
  });
}
async function decrypt() {
  try {
    const payload = JSON.parse(input.value) as { salt: string; iv: string; data: string };
    const key = await derive(decode(payload.salt));
    const data = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decode(payload.iv) },
      key,
      decode(payload.data),
    );
    output.value = new TextDecoder().decode(data);
  } catch {
    output.value = "Unable to decrypt. Check password and payload.";
  }
}
</script>
<template>
  <ToolWorkbench description="Encrypt or decrypt text with AES-GCM and a password using Web Crypto."
    ><div class="grid gap-5">
      <UInput
        v-model="password"
        type="password"
        placeholder="Encryption password"
      />
      <div class="grid gap-5 lg:grid-cols-2">
        <UTextarea
          v-model="input"
          :rows="10"
          placeholder="Plaintext or encrypted JSON payload"
        /><UTextarea
          v-model="output"
          :rows="10"
          readonly
          placeholder="Result appears here."
        />
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          label="Encrypt"
          icon="i-lucide-lock"
          @click="encrypt"
        /><UButton
          label="Decrypt"
          color="neutral"
          variant="outline"
          icon="i-lucide-unlock"
          @click="decrypt"
        />
      </div></div
  ></ToolWorkbench>
</template>
