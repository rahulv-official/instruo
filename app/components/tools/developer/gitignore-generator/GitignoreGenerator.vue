<script setup lang="ts">
const enabled = ref<Record<string, boolean>>({
  node: true,
  nuxt: true,
  vue: false,
  macos: true,
  vscode: true,
  env: true,
  docker: false,
});
const templates = [
  {
    key: "node",
    label: "Node.js",
    lines: ["node_modules/", "npm-debug.log*", "yarn-debug.log*", "dist/"],
  },
  { key: "nuxt", label: "Nuxt", lines: [".nuxt/", ".output/", ".nitro/"] },
  { key: "vue", label: "Vue", lines: ["*.local", "*.local.*"] },
  { key: "macos", label: "macOS", lines: [".DS_Store"] },
  { key: "vscode", label: "VS Code", lines: [".vscode/*", "!.vscode/extensions.json"] },
  { key: "env", label: "Environment", lines: [".env", ".env.*", "!.env.example"] },
  { key: "docker", label: "Docker", lines: ["docker-compose.override.yml", ".docker/"] },
] as const;
const output = computed(() => {
  const lines = templates.flatMap((template) =>
    enabled.value[template.key] ? template.lines : [],
  );
  return [...new Set(lines)].join("\n");
});
const { copyText } = useCopyToClipboard();
</script>

<template>
  <ToolWorkbench description="Compose a practical .gitignore from project-specific templates.">
    <div class="grid gap-5 lg:grid-cols-[minmax(14rem,0.35fr)_minmax(0,1fr)]">
      <div class="grid content-start gap-3">
        <p class="text-highlighted text-sm font-medium">Include templates</p>
        <UCheckbox
          v-for="template in templates"
          :key="template.key"
          v-model="enabled[template.key]"
          :label="template.label"
        />
      </div>
      <div class="grid gap-3">
        <UTextarea
          :model-value="output"
          :rows="16"
          readonly
          class="w-full font-mono"
          placeholder="Choose a template."
        />
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="soft"
            label="Copy .gitignore"
            icon="i-tabler-copy"
            :disabled="!output"
            @click="copyText(output)"
          />
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
