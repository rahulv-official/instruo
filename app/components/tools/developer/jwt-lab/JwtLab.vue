<script setup lang="ts">
type JsonObject = Record<string, unknown>;
type InspectionState = "empty" | "valid" | "invalid";

interface Inspection {
  state: InspectionState;
  header: string;
  payload: string;
  error: string;
  hasSignature: boolean;
}

const token = ref("");
const header = ref('{"alg":"none","typ":"JWT"}');
const payload = ref('{"sub":"demo"}');
const headerDescription = 'Example: {"alg":"none","typ":"JWT"}';
const payloadDescription = 'Example: {"sub":"demo"}';

function resetExample() {
  header.value = '{"alg":"none","typ":"JWT"}';
  payload.value = '{"sub":"demo"}';
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function parseJsonObject(value: string, label: string): JsonObject {
  const parsed: unknown = JSON.parse(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed as JsonObject;
}

const inspection = computed<Inspection>(() => {
  const value = token.value.trim();

  if (!value) {
    return { state: "empty", header: "", payload: "", error: "", hasSignature: false };
  }

  const parts = value.split(".");

  if (parts.length !== 3) {
    return {
      state: "invalid",
      header: "",
      payload: "",
      error: "JWT must contain three dot-separated parts: header, payload, and signature.",
      hasSignature: false,
    };
  }

  try {
    const decodedHeader = parseJsonObject(decodeBase64Url(parts[0] ?? ""), "Header");
    const decodedPayload = parseJsonObject(decodeBase64Url(parts[1] ?? ""), "Payload");

    return {
      state: "valid",
      header: JSON.stringify(decodedHeader, null, 2),
      payload: JSON.stringify(decodedPayload, null, 2),
      error: "",
      hasSignature: Boolean(parts[2]),
    };
  } catch {
    return {
      state: "invalid",
      header: "",
      payload: "",
      error: "JWT header or payload is not valid base64url-encoded JSON.",
      hasSignature: false,
    };
  }
});

const generated = computed(() => {
  try {
    const parsedHeader = parseJsonObject(header.value, "Header JSON");
    const parsedPayload = parseJsonObject(payload.value, "Payload JSON");

    return {
      token: `${encodeBase64Url(JSON.stringify(parsedHeader))}.${encodeBase64Url(JSON.stringify(parsedPayload))}.`,
      error: "",
    };
  } catch (error) {
    return {
      token: "",
      error:
        error instanceof Error
          ? error.message
          : "Header and payload must contain valid JSON objects.",
    };
  }
});

const { copyText } = useCopyToClipboard();
</script>

<template>
  <ToolWorkbench description="Inspect JWT claims or create an unsigned token-shaped value locally.">
    <div class="grid gap-7">
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-tabler-alert-triangle"
        title="Unsigned output only"
        description="Generated values have an empty signature. Use them for local demos and decoding only — never for access control or production credentials."
      />

      <section class="grid gap-5">
        <div>
          <h2 class="text-highlighted text-base font-semibold">Inspect a token</h2>
          <p class="text-muted mt-1 text-sm">
            Decode header and payload locally. Signature presence is shown, but never verified.
          </p>
        </div>

        <UFormField
          label="JWT to inspect"
          description="Paste a three-part token. Nothing leaves your browser."
        >
          <UTextarea
            v-model="token"
            :rows="5"
            class="w-full font-mono"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
          />
        </UFormField>

        <UAlert
          v-if="inspection.state === 'invalid'"
          color="error"
          variant="subtle"
          icon="i-tabler-alert-circle"
          title="Could not decode token"
          :description="inspection.error"
        />

        <div
          v-else
          class="grid gap-5"
        >
          <div
            v-if="inspection.state === 'valid'"
            class="flex flex-wrap items-center gap-2"
          >
            <UBadge
              :color="inspection.hasSignature ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ inspection.hasSignature ? "Signature present · not verified" : "Unsigned token" }}
            </UBadge>
            <span class="text-muted text-sm">Decoded locally from the pasted value.</span>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <UFormField
              label="Header JSON"
              description="Algorithm and token metadata."
            >
              <UTextarea
                :model-value="inspection.header"
                :rows="7"
                readonly
                class="w-full font-mono"
                placeholder="Decoded header appears here."
              />
            </UFormField>
            <UFormField
              label="Payload JSON"
              description="Claims carried by the token."
            >
              <UTextarea
                :model-value="inspection.payload"
                :rows="7"
                readonly
                class="w-full font-mono"
                placeholder="Decoded payload appears here."
              />
            </UFormField>
          </div>
        </div>
      </section>

      <div class="border-muted border-t" />

      <section class="grid gap-5">
        <div>
          <h2 class="text-highlighted text-base font-semibold">Create an unsigned token</h2>
          <p class="text-muted mt-1 text-sm">
            Shape JSON for a demo token. The final signature segment stays empty by design.
          </p>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <UFormField
            label="Header JSON"
            :description="headerDescription"
          >
            <UTextarea
              v-model="header"
              :rows="7"
              class="w-full font-mono"
              spellcheck="false"
            />
          </UFormField>
          <UFormField
            label="Payload JSON"
            :description="payloadDescription"
          >
            <UTextarea
              v-model="payload"
              :rows="7"
              class="w-full font-mono"
              spellcheck="false"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="generated.error"
          color="error"
          variant="subtle"
          icon="i-tabler-braces"
          title="Invalid JSON"
          :description="generated.error"
        />

        <UFormField
          label="Token-shaped output"
          description="Unsigned output ends with a trailing dot because no signature is created."
        >
          <UTextarea
            :model-value="generated.token"
            :rows="4"
            readonly
            class="w-full font-mono"
            placeholder="Encoded value appears here."
          />
        </UFormField>

        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            label="Reset example"
            icon="i-tabler-refresh"
            @click="resetExample"
          />
          <UButton
            color="neutral"
            variant="soft"
            label="Copy token-shaped value"
            icon="i-tabler-copy"
            :disabled="!generated.token"
            @click="copyText(generated.token)"
          />
        </div>
      </section>
    </div>
  </ToolWorkbench>
</template>
