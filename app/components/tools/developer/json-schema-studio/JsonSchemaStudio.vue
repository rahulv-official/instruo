<script setup lang="ts">
const source = ref(`{"name":"Ada","age":36,"tags":["math"]}`);
const schema = ref("");
const status = ref("");
const { copyText } = useCopyToClipboard();

function infer(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value))
    return { type: "array", items: value[0] === undefined ? {} : infer(value[0]) };
  if (typeof value === "object") {
    const properties = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, infer(item)]),
    );
    return {
      type: "object",
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    };
  }
  return { type: typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value };
}

function generate() {
  try {
    const value = JSON.parse(source.value);
    schema.value = JSON.stringify(
      { $schema: "https://json-schema.org/draft/2020-12/schema", ...infer(value) },
      null,
      2,
    );
    status.value = "Schema generated.";
  } catch {
    status.value = "Input must be valid JSON.";
  }
}

function matches(value: unknown, rule: Record<string, any>, path = "$"): string[] {
  const errors: string[] = [];
  const type = rule.type;
  const valid =
    type === "null"
      ? value === null
      : type === "array"
        ? Array.isArray(value)
        : type === "object"
          ? typeof value === "object" && value !== null && !Array.isArray(value)
          : type === "integer"
            ? Number.isInteger(value)
            : typeof value === type;
  if (type && !valid) return [`${path}: expected ${type}`];
  if (Array.isArray(value) && rule.items)
    value.forEach((item, index) => errors.push(...matches(item, rule.items, `${path}[${index}]`)));
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    for (const key of rule.required ?? [])
      if (!(key in object)) errors.push(`${path}.${key}: required property missing`);
    for (const [key, child] of Object.entries(rule.properties ?? {}))
      if (key in object)
        errors.push(...matches(object[key], child as Record<string, any>, `${path}.${key}`));
  }
  return errors;
}

function validate() {
  try {
    const errors = matches(JSON.parse(source.value), JSON.parse(schema.value));
    status.value = errors.length ? errors.slice(0, 6).join("\n") : "Valid: JSON matches schema.";
  } catch {
    status.value = "Provide valid JSON and a valid JSON Schema.";
  }
}

generate();
</script>

<template>
  <ToolWorkbench
    description="Generate and validate JSON Schema locally, with path-specific feedback."
  >
    <div class="grid gap-5">
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="JSON document">
          <UTextarea
            v-model="source"
            :rows="12"
            class="w-full font-mono"
          />
        </UFormField>
        <UFormField
          label="JSON Schema"
          help="Edit generated schema before validating."
        >
          <UTextarea
            v-model="schema"
            :rows="12"
            class="w-full font-mono"
          />
        </UFormField>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Generate schema"
          icon="i-tabler-sparkles"
          @click="generate"
        />
        <UButton
          label="Validate JSON"
          icon="i-tabler-shield-check"
          color="neutral"
          variant="soft"
          @click="validate"
        />
        <UButton
          label="Copy schema"
          icon="i-tabler-copy"
          color="neutral"
          variant="outline"
          :disabled="!schema"
          @click="copyText(schema)"
        />
      </div>
      <UAlert
        v-if="status"
        color="primary"
        variant="subtle"
        title="Schema status"
        :description="status"
      />
    </div>
  </ToolWorkbench>
</template>
