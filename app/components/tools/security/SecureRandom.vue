<script setup lang="ts">
const length = ref(24);
const alphabet = ref("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789");
const output = ref("");
function generate() {
  const source = alphabet.value || "0123456789abcdefghijklmnopqrstuvwxyz";
  output.value = Array.from(
    crypto.getRandomValues(new Uint8Array(Math.min(512, Math.max(1, length.value)))),
    (byte) => source[byte % source.length]!,
  ).join("");
}
</script>
<template>
  <ToolWorkbench description="Generate random strings using the browser Web Crypto API."
    ><div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Length"
          ><UInput
            v-model.number="length"
            type="number"
            min="1"
            max="512" /></UFormField
        ><UFormField label="Alphabet"><UInput v-model="alphabet" /></UFormField>
      </div>
      <UButton
        label="Generate"
        icon="i-lucide-dices"
        class="w-fit"
        @click="generate"
      /><UTextarea
        v-model="output"
        :rows="4"
        readonly
        class="font-mono"
      /></div
  ></ToolWorkbench>
</template>
