<script setup lang="ts">
type Target = "typescript" | "zod" | "valibot" | "typebox";
const source = ref(`{"name":"Ada","age":36,"active":true}`);
const name = ref("User");
const target = ref<Target>("typescript");
const { copyText } = useCopyToClipboard();

const targets = [
  { label: "TypeScript", value: "typescript" },
  { label: "Zod", value: "zod" },
  { label: "Valibot", value: "valibot" },
  { label: "TypeBox", value: "typebox" },
];
function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `${value[0] === undefined ? "unknown" : typeOf(value[0])}[]`;
  if (typeof value === "object")
    return `{\n${Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `  ${JSON.stringify(key)}: ${typeOf(item)};`)
      .join("\n")}\n}`;
  return typeof value === "number" && Number.isInteger(value) ? "number" : typeof value;
}
const parsed = computed(() => {
  try {
    return { value: JSON.parse(source.value) as unknown, error: "" };
  } catch {
    return { value: null, error: "Input must be valid JSON." };
  }
});
const output = computed(() => {
  if (parsed.value.error) return parsed.value.error;
  const root = name.value.replace(/[^\w$]/g, "") || "Root";
  if (target.value === "typescript")
    return `export interface ${root} ${typeOf(parsed.value.value)}`;
  const shape =
    typeof parsed.value.value === "object" &&
    parsed.value.value !== null &&
    !Array.isArray(parsed.value.value)
      ? Object.entries(parsed.value.value as Record<string, unknown>)
          .map(
            ([key, value]) =>
              `  ${JSON.stringify(key)}: ${target.value === "zod" ? `z.${typeOf(value) === "string" ? "string" : typeOf(value) === "number" ? "number" : typeOf(value) === "boolean" ? "boolean" : "unknown"}()` : typeOf(value)}`,
          )
          .join(",\n")
      : `  value: ${typeOf(parsed.value.value)}`;
  if (target.value === "zod")
    return `import { z } from "zod";\n\nexport const ${root}Schema = z.object({\n${shape}\n});\nexport type ${root} = z.infer<typeof ${root}Schema>;`;
  if (target.value === "valibot")
    return `import * as v from "valibot";\n\nexport const ${root}Schema = v.object({\n${shape}\n});`;
  return `import { Type } from "@sinclair/typebox";\n\nexport const ${root}Schema = Type.Object({\n${shape}\n});`;
});
</script>

<template>
  <ToolWorkbench
    description="Turn sample JSON into typed contracts for your next API or data model."
  >
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <UFormField label="Root name">
          <UInput
            v-model="name"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Target">
          <USelect
            v-model="target"
            :items="targets"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Sample JSON">
          <UTextarea
            v-model="source"
            :rows="12"
            class="w-full font-mono"
          />
        </UFormField>
        <UFormField label="Generated code">
          <UTextarea
            :model-value="output"
            :rows="12"
            readonly
            class="w-full font-mono"
          />
        </UFormField>
      </div>
      <div class="flex justify-end">
        <UButton
          label="Copy code"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          :disabled="!!parsed.error"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
