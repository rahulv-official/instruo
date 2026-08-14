<script setup lang="ts">
const secret = ref("");
const account = ref("");
const issuer = ref("");
const code = ref("");
const error = ref("");
const tick = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
const remaining = computed(() => {
  void tick.value;
  return 30 - (Math.floor(Date.now() / 1000) % 30);
});
const progress = computed(() => (remaining.value / 30) * 100);
const { copyText } = useCopyToClipboard();

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = value.toUpperCase().replace(/[\s=-]/g, "");
  let bits = "";
  for (const character of clean) {
    const position = alphabet.indexOf(character);
    if (position < 0) throw new Error("Secret must be a valid Base32 value.");
    bits += position.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let index = 0; index < bytes.length; index += 1)
    bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  return bytes;
}

async function generate() {
  error.value = "";
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      decodeBase32(secret.value),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const counter = Math.floor(Date.now() / 1000 / 30);
    const bytes = new ArrayBuffer(8);
    const view = new DataView(bytes);
    view.setUint32(4, counter);
    const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes));
    const offset = (digest[digest.length - 1] ?? 0) & 0x0f;
    const number =
      (((digest[offset] ?? 0) & 0x7f) << 24) |
      ((digest[offset + 1] ?? 0) << 16) |
      ((digest[offset + 2] ?? 0) << 8) |
      (digest[offset + 3] ?? 0);
    code.value = String(number % 1_000_000).padStart(6, "0");
  } catch (cause) {
    code.value = "";
    error.value = cause instanceof Error ? cause.message : "Could not generate a code.";
  }
}

function importUri() {
  try {
    const uri = new URL(secret.value);
    if (uri.protocol !== "otpauth:") throw new Error("Paste an otpauth:// URI or a Base32 secret.");
    secret.value = uri.searchParams.get("secret") ?? "";
    issuer.value = uri.searchParams.get("issuer") ?? "";
    account.value = decodeURIComponent(uri.pathname.replace(/^\/\//, ""));
  } catch {
    error.value = "That does not look like a valid otpauth:// URI.";
  }
}

onMounted(() => {
  timer = setInterval(() => {
    tick.value += 1;
    if (secret.value && remaining.value === 30) void generate();
  }, 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <ToolWorkbench
    description="Generate six-digit TOTP codes locally from a Base32 secret or otpauth URI."
  >
    <div class="grid max-w-2xl gap-5">
      <UFormField label="Secret or otpauth URI">
        <UInput
          v-model="secret"
          class="w-full font-mono"
          placeholder="JBSWY3DPEHPK3PXP"
          @keyup.enter="generate"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Generate code"
          icon="tabler:key"
          @click="generate"
        />
        <UButton
          label="Read URI"
          color="neutral"
          variant="outline"
          @click="importUri"
        />
      </div>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="tabler:alert-circle"
        title="Could not generate code"
        :description="error"
      />
      <div class="border-default bg-elevated grid gap-3 border p-5 text-center">
        <span class="text-muted text-sm">{{ issuer || account || "Authenticator code" }}</span>
        <output
          class="text-highlighted font-mono text-5xl font-semibold tracking-[0.25em] tabular-nums"
          aria-live="polite"
          >{{ code || "------" }}</output
        >
        <UProgress
          :model-value="progress"
          color="primary"
          aria-label="Code lifetime"
        />
        <span class="text-muted text-sm">Refreshes in {{ remaining }}s</span>
        <UButton
          label="Copy code"
          icon="tabler:copy"
          class="mx-auto"
          :disabled="!code"
          @click="copyText(code)"
        />
      </div>
      <p class="text-muted text-sm">
        TOTP secrets are sensitive. Use this tool on a trusted device and never share the secret.
      </p>
    </div>
  </ToolWorkbench>
</template>
