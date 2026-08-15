<script setup lang="ts">
interface Edge {
  from: string;
  to: string;
}
const source = ref(`flowchart TD\n  Start --> Review\n  Review --> Ship`);
const { copyText } = useCopyToClipboard();
const parsed = computed(() => {
  const edges: Edge[] = [];
  for (const match of source.value.matchAll(/([\w-]+)\s*-->\s*([\w-]+)/g))
    edges.push({ from: match[1]!, to: match[2]! });
  const ids = [...new Set(edges.flatMap((edge) => [edge.from, edge.to]))];
  return { nodes: ids.map((id) => ({ id, label: id.replaceAll("_", " ") })), edges };
});
const output = computed(() => source.value.trim());
function x(index: number) {
  return 120 + (index % 3) * 220;
}
function y(index: number) {
  return 70 + Math.floor(index / 3) * 120;
}
function nodeIndex(id: string) {
  return parsed.value.nodes.findIndex((node) => node.id === id);
}
</script>

<template>
  <ToolWorkbench
    description="Edit a small flowchart locally and preview its structure without a remote renderer."
  >
    <div class="grid gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
      <div class="grid content-start gap-3">
        <UFormField
          label="Mermaid source"
          help="Supports basic flowchart A --> B edges."
        >
          <UTextarea
            v-model="source"
            :rows="14"
            class="w-full font-mono"
          />
        </UFormField>
        <UButton
          label="Copy source"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          class="w-fit"
          @click="copyText(output)"
        />
      </div>
      <div class="border-muted bg-muted/10 min-h-80 overflow-auto rounded-md border p-3">
        <svg
          viewBox="0 0 800 420"
          class="h-full min-h-72 w-full"
          role="img"
          aria-label="Flowchart preview"
        >
          <defs>
            <marker
              id="mermaid-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path
                d="M0,0 L8,4 L0,8 Z"
                fill="currentColor"
              />
            </marker>
          </defs>
          <g
            v-for="edge in parsed.edges"
            :key="`${edge.from}-${edge.to}`"
          >
            <line
              :x1="x(nodeIndex(edge.from)) + 70"
              :y1="y(nodeIndex(edge.from)) + 24"
              :x2="x(nodeIndex(edge.to))"
              :y2="y(nodeIndex(edge.to)) + 24"
              stroke="currentColor"
              stroke-width="2"
              marker-end="url(#mermaid-arrow)"
            />
          </g>
          <g
            v-for="(node, index) in parsed.nodes"
            :key="node.id"
          >
            <rect
              :x="x(index)"
              :y="y(index)"
              width="140"
              height="48"
              rx="6"
              class="fill-elevated stroke-default"
              stroke-width="2"
            />
            <text
              :x="x(index) + 70"
              :y="y(index) + 30"
              text-anchor="middle"
              class="fill-default text-sm"
            >
              {{ node.label }}
            </text>
          </g>
        </svg>
      </div>
    </div>
  </ToolWorkbench>
</template>
