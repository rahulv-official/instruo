<script setup lang="ts">
type Directive =
  "default-src" | "script-src" | "style-src" | "img-src" | "font-src" | "connect-src" | "frame-src";
const directiveKeys: Directive[] = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "frame-src",
];
const directives = ref<Record<Directive, string>>({
  "default-src": "'self'",
  "script-src": "'self'",
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: https:",
  "font-src": "'self' https:",
  "connect-src": "'self'",
  "frame-src": "",
});
function placeholderFor(key: Directive) {
  return key === "frame-src" ? "'none'" : "'self'";
}
const header = computed(() =>
  directiveKeys
    .filter((key) => directives.value[key].trim())
    .map((key) => `${key} ${directives.value[key].trim()};`)
    .join("\n"),
);
const { copyText } = useCopyToClipboard();
</script>

<template>
  <ToolWorkbench
    description="Build a Content-Security-Policy header with a readable directive editor."
  >
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="grid gap-4">
        <UFormField
          v-for="key in directiveKeys"
          :key="key"
          :label="key"
        >
          <UInput
            v-model="directives[key]"
            class="w-full font-mono"
            :placeholder="placeholderFor(key)"
          />
        </UFormField>
      </div>
      <div class="grid content-start gap-3">
        <UFormField label="HTTP header value">
          <UTextarea
            :model-value="header"
            :rows="14"
            readonly
            class="w-full font-mono"
          /> </UFormField
        ><UButton
          color="neutral"
          variant="soft"
          label="Copy policy"
          icon="i-tabler-copy"
          class="w-fit"
          @click="copyText(header)"
        />
        <p class="text-muted text-xs">
          Test a policy in report-only mode before enforcing it in production.
        </p>
      </div>
    </div>
  </ToolWorkbench>
</template>
