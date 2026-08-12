<script setup lang="ts">
import type { RadioGroupItem } from "@nuxt/ui";

type TransformerMode = "case" | "dedupe" | "reverse" | "slug" | "sort" | "whitespace";

const props = defineProps<{ mode: TransformerMode }>();

const defaultOperations: Record<TransformerMode, string> = {
  case: "lowercase",
  dedupe: "dedupe",
  reverse: "reverse",
  slug: "slug",
  sort: "alphabetical",
  whitespace: "whitespace",
};

const operationOptions: Partial<Record<TransformerMode, RadioGroupItem[]>> = {
  case: [
    { label: "lowercase", value: "lowercase" },
    { label: "UPPERCASE", value: "uppercase" },
    { label: "Sentence case", value: "sentence" },
    { label: "Title Case", value: "title" },
  ],
  sort: [
    { label: "Alphabetical", value: "alphabetical" },
    { label: "By length", value: "length" },
    { label: "Numerical", value: "numerical" },
  ],
};

const labels: Record<TransformerMode, string> = {
  case: "case conversion",
  dedupe: "duplicate removal",
  reverse: "reversed text",
  slug: "URL slug",
  sort: "sorted lines",
  whitespace: "cleaned whitespace",
};

const input = ref("");
const operation = ref(defaultOperations[props.mode]);
const { copyText } = useCopyToClipboard();

const options = computed(() => operationOptions[props.mode] ?? []);
const output = computed(() => transform(input.value));

function transform(value: string) {
  if (!value) return "";

  switch (props.mode) {
    case "case":
      return convertCase(value, operation.value);
    case "dedupe":
      return [...new Set(value.split(/\r?\n/))].join("\n");
    case "reverse":
      return Array.from(value).reverse().join("");
    case "slug":
      return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    case "sort":
      return sortLines(value, operation.value);
    case "whitespace":
      return value
        .replace(/[^\S\r\n]+/g, " ")
        .replace(/ *\r?\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
  }
}

function convertCase(value: string, selectedOperation: string) {
  switch (selectedOperation) {
    case "uppercase":
      return value.toUpperCase();
    case "sentence":
      return value
        .toLowerCase()
        .replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (match) => match.toUpperCase());
    case "title":
      return value.toLowerCase().replace(/\b\p{L}/gu, (character) => character.toUpperCase());
    default:
      return value.toLowerCase();
  }
}

function sortLines(value: string, selectedOperation: string) {
  const lines = value.split(/\r?\n/).filter((line) => line.trim());

  if (selectedOperation === "length") {
    return lines.toSorted((a, b) => a.length - b.length).join("\n");
  }
  if (selectedOperation === "numerical") {
    return lines
      .filter((line) => Number.isFinite(Number(line.trim())))
      .toSorted((a, b) => Number(a) - Number(b))
      .join("\n");
  }

  return lines.toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true })).join("\n");
}
</script>

<template>
  <ToolWorkbench :description="`${labels[mode]} updates as you type.`">
    <div class="grid gap-6">
      <URadioGroup
        v-if="options.length"
        v-model="operation"
        :items="options"
        orientation="horizontal"
        aria-label="Transformation"
      />

      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Input">
          <UTextarea
            v-model="input"
            placeholder="Type or paste text…"
            autoresize
            :rows="12"
            :maxrows="18"
            class="w-full"
            :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
          />
        </UFormField>
        <UFormField label="Output">
          <UTextarea
            :model-value="output"
            readonly
            placeholder="Output appears here."
            autoresize
            :rows="12"
            :maxrows="18"
            class="w-full"
            :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
          />
        </UFormField>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          label="Clear"
          color="neutral"
          variant="ghost"
          icon="i-lucide-rotate-ccw"
          :disabled="!input"
          @click="input = ''"
        />
        <UButton
          label="Copy output"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
