<script setup lang="ts">
type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const algorithmItems: { label: string; value: HashAlgorithm }[] = [
  { label: "SHA-256", value: "SHA-256" },
  { label: "SHA-384", value: "SHA-384" },
  { label: "SHA-512", value: "SHA-512" },
  { label: "SHA-1 (legacy)", value: "SHA-1" },
];

const input = ref("");
const algorithm = ref<HashAlgorithm>("SHA-256");
const output = ref("");
const errorMessage = ref("");
const { copyText } = useCopyToClipboard();
let requestId = 0;

const byteCount = computed(() => new TextEncoder().encode(input.value).length);
const selectedAlgorithm = computed(() =>
  algorithmItems.find((item) => item.value === algorithm.value)!,
);

async function createHash(value = input.value, selected = algorithm.value) {
  const currentRequest = ++requestId;
  errorMessage.value = "";

  if (!value) {
    output.value = "";
    return;
  }

  try {
    const digest = await crypto.subtle.digest(selected, new TextEncoder().encode(value));
    if (currentRequest !== requestId) return;
    output.value = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    if (currentRequest !== requestId) return;
    output.value = "";
    errorMessage.value = "Hashing requires a secure browser context.";
  }
}

function setInput(value: string) {
  input.value = value;
  createHash(value);
}

function setAlgorithm(value: string | undefined) {
  if (!algorithmItems.some((item) => item.value === value)) return;
  algorithm.value = value as HashAlgorithm;
  createHash(input.value, algorithm.value);
}

function clear() {
  requestId += 1;
  input.value = "";
  output.value = "";
  errorMessage.value = "";
}
</script>

<template>
  <ToolWorkbench description="Create a SHA digest locally. Output updates as you type.">
    <div class="grid gap-5">
      <UFormField
        label="Algorithm"
        :description="
          algorithm === 'SHA-1'
            ? 'SHA-1 is retained for compatibility, not new security designs.'
            : `${selectedAlgorithm.label} cryptographic digest.`
        "
        :ui="{ container: 'mt-2' }"
      >
        <USelect
          :model-value="algorithm"
          :items="algorithmItems"
          value-key="value"
          label-key="label"
          size="lg"
          class="w-full sm:max-w-xs"
          :ui="{ base: 'rounded-md', content: 'rounded-md', item: 'before:rounded-md' }"
          @update:model-value="setAlgorithm"
        />
      </UFormField>

      <div class="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <UFormField
          label="Input"
          :description="`${byteCount} UTF-8 bytes.`"
          :ui="{ container: 'mt-2' }"
        >
          <UTextarea
            :model-value="input"
            placeholder="Enter text to hash…"
            :rows="10"
            class="w-full"
            :ui="{ base: 'min-h-56 font-mono text-sm leading-6 sm:min-h-72' }"
            @update:model-value="setInput"
          />
        </UFormField>

        <UFormField
          label="Digest"
          description="Lowercase hexadecimal output."
          :error="errorMessage || undefined"
          :ui="{ container: 'mt-2' }"
        >
          <UTextarea
            :model-value="output"
            readonly
            placeholder="Digest appears here."
            :rows="10"
            class="w-full"
            :ui="{
              base: 'min-h-56 break-all font-mono text-sm leading-6 sm:min-h-72',
            }"
          />
        </UFormField>
      </div>

      <div class="border-default/70 flex flex-wrap justify-end gap-2 border-t pt-4">
        <UButton
          color="neutral"
          variant="ghost"
          label="Clear"
          icon="i-tabler-rotate"
          :disabled="!input"
          @click="clear"
        />
        <UButton
          color="neutral"
          variant="soft"
          label="Copy digest"
          icon="i-tabler-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
