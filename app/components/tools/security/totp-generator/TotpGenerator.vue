<script setup lang="ts">
const secret = ref("");
const account = ref("");
const issuer = ref("");
const code = ref("");
const error = ref("");
const algorithm = ref<"SHA-1" | "SHA-256" | "SHA-512">("SHA-1");
const digits = ref(6);
const period = ref(30);
const now = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
const remaining = computed(() => {
  if (!now.value) return period.value;
  return period.value - (now.value % period.value);
});
const progress = computed(() => (remaining.value / period.value) * 100);
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
    if (!now.value) now.value = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      "raw",
      decodeBase32(secret.value),
      { name: "HMAC", hash: algorithm.value },
      false,
      ["sign"],
    );
    const counter = Math.floor(now.value / period.value);
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
    code.value = String(number % 10 ** digits.value).padStart(digits.value, "0");
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
    account.value = decodeURIComponent(uri.pathname.replace(/^\//, ""));
    const uriAlgorithm = (uri.searchParams.get("algorithm") ?? "SHA1")
      .toUpperCase()
      .replace("SHA", "SHA-");
    if (uriAlgorithm === "SHA-1" || uriAlgorithm === "SHA-256" || uriAlgorithm === "SHA-512") {
      algorithm.value = uriAlgorithm;
    }
    const uriDigits = Number(uri.searchParams.get("digits"));
    if (uriDigits === 6 || uriDigits === 8) digits.value = uriDigits;
    const uriPeriod = Number(uri.searchParams.get("period"));
    if (Number.isInteger(uriPeriod) && uriPeriod >= 5 && uriPeriod <= 300) period.value = uriPeriod;
    void generate();
  } catch {
    error.value = "That does not look like a valid otpauth:// URI.";
  }
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = Math.floor(Date.now() / 1000);
    if (secret.value && remaining.value === period.value) void generate();
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
          icon="i-tabler-key"
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
        icon="i-tabler-alert-circle"
        title="Could not generate code"
        :description="error"
      />
      <div class="border-default bg-elevated grid gap-3 border p-5 text-center">
        <span class="text-muted text-sm">{{ issuer || account || "Authenticator code" }}</span>
        <output
          class="text-highlighted font-mono text-5xl font-semibold tracking-[0.25em] tabular-nums"
          aria-live="polite"
          >{{ code || "-".repeat(digits) }}</output
        >
        <UProgress
          :model-value="progress"
          color="primary"
          aria-label="Code lifetime"
        />
        <span class="text-muted text-sm"
          >Refreshes in {{ remaining }}s · {{ algorithm }} · {{ digits }} digits</span
        >
        <UButton
          color="neutral"
          variant="soft"
          label="Copy code"
          icon="i-tabler-copy"
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
