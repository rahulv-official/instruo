<script setup lang="ts">
const length = ref(24);
const alphabet = ref("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789");
const output = ref("");
function generate() {
  const source = alphabet.value || "0123456789abcdefghijklmnopqrstuvwxyz";
  const targetLength = Math.min(512, Math.max(1, Math.floor(length.value || 1)));
  // Rejection sampling avoids modulo bias when the alphabet does not divide 256.
  const limit = Math.floor(256 / source.length) * source.length;
  const result: string[] = [];
  while (result.length < targetLength) {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.max(32, targetLength)));
    for (const byte of bytes) {
      if (byte >= limit) continue;
      result.push(source[byte % source.length]!);
      if (result.length === targetLength) break;
    }
  }
  output.value = result.join("");
}
</script>
<template>
  <ToolWorkbench description="Generate random strings using the browser Web Crypto API.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="Length"
          help="Choose from 1 to 512 characters."
        >
          <UInput
            v-model.number="length"
            type="number"
            min="1"
            max="512"
          />
        </UFormField>
        <UFormField
          label="Alphabet"
          help="Characters are sampled uniformly from this set."
        >
          <UInput v-model="alphabet" />
        </UFormField>
      </div>
      <UButton
        label="Generate"
        icon="i-tabler-dice"
        class="w-fit"
        @click="generate"
      /><UTextarea
        v-model="output"
        :rows="4"
        readonly
        class="font-mono"
      />
    </div>
  </ToolWorkbench>
</template>
