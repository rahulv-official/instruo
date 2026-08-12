<script setup lang="ts">
const input = ref("# Hello\n\nWrite **Markdown** here.");
const rendered = computed(() => {
  let value = escapeHtml(input.value);
  value = value
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");
  value = value
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>");
  return value
    .split(/\n{2,}/)
    .map((block) =>
      block.startsWith("<h") || block.startsWith("<li>")
        ? block
        : `<p>${block.replace(/\n/g, "<br>")}</p>`,
    )
    .join("")
    .replace(/(<li>.*<\/li>)+/g, (list) => `<ul>${list}</ul>`);
});
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}
</script>

<template>
  <ToolWorkbench description="Preview a useful subset of Markdown locally as you type.">
    <div class="grid gap-6 lg:grid-cols-2">
      <UFormField label="Markdown">
        <UTextarea
          v-model="input"
          autoresize
          :rows="14"
          class="w-full font-mono"
          placeholder="# Heading"
        />
      </UFormField>
      <section
        class="border-default/70 min-h-72 border p-5"
        aria-label="Markdown preview"
      >
        <div
          class="markdown-preview space-y-4"
          v-html="rendered"
        />
      </section>
    </div>
  </ToolWorkbench>
</template>

<style scoped>
.markdown-preview :deep(h1) {
  font-size: 1.75rem;
  font-weight: 700;
}
.markdown-preview :deep(h2) {
  font-size: 1.35rem;
  font-weight: 650;
}
.markdown-preview :deep(h3) {
  font-size: 1.1rem;
  font-weight: 650;
}
.markdown-preview :deep(p) {
  color: var(--ui-text-muted);
  line-height: 1.7;
}
.markdown-preview :deep(li) {
  margin-left: 1.25rem;
  list-style: disc;
}
.markdown-preview :deep(code) {
  border: 1px solid var(--ui-border);
  padding: 0.12rem 0.3rem;
  font-family: var(--font-mono);
}
</style>
