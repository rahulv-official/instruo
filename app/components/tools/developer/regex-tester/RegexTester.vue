<script setup lang="ts">
interface MatchResult {
  index: number;
  length: number;
  value: string;
}

const pattern = ref("\\btool\\b");
const flags = ref("gi");
const input = ref("");
const { copyText } = useCopyToClipboard();

const result = computed(() => {
  if (!pattern.value) return { error: "", matches: [] as MatchResult[] };

  try {
    const expression = new RegExp(pattern.value, flags.value);
    const matches: MatchResult[] = [];

    if (flags.value.includes("g")) {
      for (const match of input.value.matchAll(expression)) {
        matches.push({ index: match.index ?? 0, length: match[0].length, value: match[0] });
      }
    } else {
      const match = expression.exec(input.value);
      if (match) matches.push({ index: match.index, length: match[0].length, value: match[0] });
    }

    return { error: "", matches };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid regular expression.",
      matches: [] as MatchResult[],
    };
  }
});

const output = computed(() => result.value.matches.map((match) => match.value).join("\n"));
</script>

<template>
  <ToolWorkbench
    description="Test JavaScript regular expressions locally against text you provide."
  >
    <div class="grid gap-6">
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <UFormField
          label="Pattern"
          description="Use JavaScript regular expression syntax."
          :error="result.error || undefined"
        >
          <UInput
            v-model="pattern"
            size="lg"
            class="w-full"
            placeholder="\\bword\\b"
          />
        </UFormField>
        <UFormField
          label="Flags"
          description="For example, gi."
        >
          <UInput
            v-model="flags"
            size="lg"
            class="w-full font-mono"
            placeholder="gi"
          />
        </UFormField>
      </div>

      <UFormField label="Test text">
        <UTextarea
          v-model="input"
          autoresize
          :rows="10"
          :maxrows="18"
          class="w-full"
          placeholder="Paste text to test…"
          :ui="{ base: 'rounded-none font-mono text-sm leading-6' }"
        />
      </UFormField>

      <section
        class="border-default/70 border-t pt-5"
        aria-live="polite"
      >
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-highlighted font-semibold">Matches</h2>
          <span class="text-toned font-mono text-sm tabular-nums">{{ result.matches.length }}</span>
        </div>
        <p
          v-if="!result.matches.length"
          class="text-muted border-default mt-4 border p-4 text-sm"
        >
          No matches yet. Add test text or adjust the pattern.
        </p>
        <ol
          v-else
          class="border-default/70 mt-4 border-t"
        >
          <li
            v-for="match in result.matches"
            :key="`${match.index}-${match.value}`"
            class="border-default/70 flex items-center justify-between gap-4 border-b py-3 font-mono text-sm"
          >
            <code class="text-highlighted break-all">{{ match.value }}</code>
            <span class="text-toned shrink-0">index {{ match.index }}</span>
          </li>
        </ol>
      </section>

      <div class="flex justify-end">
        <UButton
          label="Copy matches"
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
