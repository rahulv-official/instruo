<script setup lang="ts">
const action = ref("commit");
const branch = ref("main");
const message = ref("update");
const files = ref("");
const command = computed(() => {
  const target = files.value.trim() ? ` ${files.value.trim()}` : " .";
  if (action.value === "branch") return `git switch -c ${branch.value || "feature/name"}`;
  if (action.value === "push")
    return `git add${target} && git commit -m \"${message.value || "update"}\" && git push -u origin ${branch.value || "main"}`;
  if (action.value === "log") return "git log --oneline --decorate --graph -20";
  return `git add${target} && git commit -m \"${message.value || "update"}\"`;
});
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Build common Git commands without remembering every flag.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="Action"
          class="min-w-sm"
        >
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
            :ui="{
              base: 'w-full sm:min-w-56',
            }"
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
      <UTextarea
        :model-value="command"
        :rows="3"
        readonly
        class="font-mono"
      />
      <div class="flex justify-end">
        <UButton
          label="Copy command"
          icon="i-lucide-copy"
          @click="copyText(command)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
