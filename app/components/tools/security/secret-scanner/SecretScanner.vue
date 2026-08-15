<script setup lang="ts">
interface Finding {
  kind: string;
  line: number;
  preview: string;
}
const source = ref(`const stripeKey = "sk_live_1234567890abcdef";\nconst password = "change-me";`);
const patterns: [string, RegExp][] = [
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["Private key", /-----BEGIN [A-Z ]+ PRIVATE KEY-----/],
  ["GitHub token", /gh[pousr]_\w{20,}/],
  ["Stripe secret", /sk_(live|test)_\w{12,}/],
  [
    "Generic secret assignment",
    /(?:password|secret|token|api[_-]?key)\s*[:=]\s*["'][^"']{6,}["']/i,
  ],
];
const findings = computed<Finding[]>(() => {
  const result: Finding[] = [];
  source.value.split("\n").forEach((line, index) => {
    for (const [kind, pattern] of patterns) {
      const match = line.match(pattern);
      if (match?.[0])
        result.push({
          kind,
          line: index + 1,
          preview:
            match[0].length > 10
              ? `${match[0].slice(0, 4)}…${match[0].slice(-4)}`
              : "Possible secret",
        });
    }
  });
  return result;
});
</script>

<template>
  <ToolWorkbench
    description="Find likely secrets in pasted code before they reach a commit or issue tracker."
  >
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <UFormField label="Code or configuration"
        ><UTextarea
          v-model="source"
          :rows="20"
          class="w-full font-mono"
      /></UFormField>
      <div class="grid content-start gap-3">
        <div class="border-muted bg-muted/20 rounded-md border p-4">
          <p class="text-muted text-xs">Findings</p>
          <p class="text-highlighted mt-1 text-3xl font-semibold tabular-nums">
            {{ findings.length }}
          </p>
        </div>
        <ul
          v-if="findings.length"
          class="grid gap-2"
          aria-live="polite"
        >
          <li
            v-for="finding in findings"
            :key="`${finding.line}-${finding.kind}`"
            class="border-muted rounded-md border p-3"
          >
            <p class="font-medium">{{ finding.kind }}</p>
            <p class="text-muted mt-1 text-xs">Line {{ finding.line }} · {{ finding.preview }}</p>
          </li>
        </ul>
        <UAlert
          v-else
          color="success"
          variant="subtle"
          title="No common patterns found"
          description="This scanner is heuristic. Review code manually before sharing it."
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
