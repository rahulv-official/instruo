<script setup lang="ts">
interface ScriptRow {
  name: string;
  command: string;
}
const scripts = ref<ScriptRow[]>([
  { name: "dev", command: "nuxt dev" },
  { name: "build", command: "nuxt build" },
]);
const packageName = ref("my-app");
const { copyText } = useCopyToClipboard();
const output = computed(() =>
  JSON.stringify(
    {
      name: packageName.value || "my-app",
      scripts: Object.fromEntries(
        scripts.value.filter((row) => row.name.trim()).map((row) => [row.name.trim(), row.command]),
      ),
    },
    null,
    2,
  ),
);
function add() {
  scripts.value.push({ name: "", command: "" });
}
function remove(index: number) {
  scripts.value.splice(index, 1);
}
</script>

<template>
  <ToolWorkbench
    description="Build a clean package.json scripts block without hand-editing repeated JSON syntax."
  >
    <div class="grid gap-5">
      <UFormField label="Package name">
        <UInput
          v-model="packageName"
          class="max-w-xl"
          placeholder="my-app"
        />
      </UFormField>
      <div class="grid gap-3">
        <div
          class="text-muted grid grid-cols-[minmax(8rem,0.35fr)_minmax(0,1fr)_2.5rem] gap-3 text-xs font-medium"
        >
          <span>Script</span><span>Command</span><span class="sr-only">Remove</span>
        </div>
        <div
          v-for="(script, index) in scripts"
          :key="index"
          class="grid grid-cols-[minmax(8rem,0.35fr)_minmax(0,1fr)_2.5rem] items-center gap-3"
        >
          <UInput
            v-model="script.name"
            placeholder="test"
          />
          <UInput
            v-model="script.command"
            class="font-mono"
            placeholder="vitest run"
          />
          <UButton
            icon="i-tabler-trash"
            color="error"
            variant="ghost"
            aria-label="Remove script"
            @click="remove(index)"
          />
        </div>
        <UButton
          label="Add script"
          icon="i-tabler-plus"
          color="neutral"
          variant="outline"
          class="w-fit"
          @click="add"
        />
      </div>
      <div class="grid gap-3 lg:grid-cols-2">
        <UFormField label="package.json preview">
          <UTextarea
            :model-value="output"
            :rows="12"
            readonly
            class="w-full font-mono"
          />
        </UFormField>
        <div class="grid content-start gap-3">
          <UFormField label="Run commands">
            <UTextarea
              :model-value="
                scripts
                  .filter((row) => row.name)
                  .map((row) => `pnpm run ${row.name}`)
                  .join('\n')
              "
              :rows="12"
              readonly
              class="w-full font-mono"
            />
          </UFormField>
          <UButton
            label="Copy JSON"
            icon="i-tabler-copy"
            color="neutral"
            variant="soft"
            class="w-fit"
            @click="copyText(output)"
          />
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
