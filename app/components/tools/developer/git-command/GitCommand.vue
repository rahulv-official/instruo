<script setup lang="ts">
const action = ref("commit");
const branch = ref("main");
const message = ref("update");
const files = ref("");
function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
const command = computed(() => {
  const target = files.value.trim() ? ` ${shellQuote(files.value.trim())}` : " .";
  if (action.value === "branch")
    return `git switch -c ${shellQuote(branch.value || "feature/name")}`;
  if (action.value === "push")
    return `git add${target} && git commit -m ${shellQuote(message.value || "update")} && git push -u origin ${shellQuote(branch.value || "main")}`;
  if (action.value === "log") return "git log --oneline --decorate --graph -20";
  return `git add${target} && git commit -m ${shellQuote(message.value || "update")}`;
});
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Build common Git commands without remembering every flag.">
    <div class="grid gap-6">
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Action">
          <USelect
            v-model="action"
            :items="[
              { label: 'Commit', value: 'commit' },
              { label: 'Commit and push', value: 'push' },
              { label: 'Create branch', value: 'branch' },
              { label: 'Recent log', value: 'log' },
            ]"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Branch">
          <UInput v-model="branch" />
        </UFormField>
        <UFormField label="Message">
          <UInput v-model="message" />
        </UFormField>
        <UFormField label="Files">
          <UInput
            v-model="files"
            placeholder="src/"
          />
        </UFormField>
      </div>
      <section class="bg-muted/55 overflow-hidden rounded-md ring-1 ring-[var(--ui-border-field)]">
        <header class="border-muted flex items-center justify-between gap-4 border-b px-4 py-3">
          <div>
            <h2 class="text-highlighted text-sm font-medium">Generated command</h2>
            <p class="text-muted mt-0.5 text-xs">Review before running it in your terminal.</p>
          </div>
          <UButton
            color="neutral"
            variant="soft"
            label="Copy command"
            icon="i-tabler-copy"
            size="sm"
            @click="copyText(command)"
          />
        </header>
        <pre
          class="text-highlighted min-h-28 overflow-x-auto p-4 font-mono text-sm leading-6 whitespace-pre-wrap sm:p-5"
        ><code>{{ command }}</code></pre>
      </section>
    </div>
  </ToolWorkbench>
</template>
