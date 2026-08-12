<script setup lang="ts">
const title = ref("A clear title for your page");
const description = ref("A short description that earns the click.");
const color = ref("#17324c");
</script>
<template>
  <ToolWorkbench
    description="Preview a social sharing card title, description, and color before publishing."
    ><div class="grid gap-5">
      <div class="grid gap-4">
        <UInput
          v-model="title"
          placeholder="Title"
        /><UTextarea
          v-model="description"
          :rows="3"
          placeholder="Description"
        /><UInput
          v-model="color"
          placeholder="#17324c"
        />
      </div>
      <article
        class="border-default grid min-h-64 content-end gap-2 border p-6 text-white"
        :style="{ background: color }"
      >
        <span class="font-mono text-xs tracking-[0.16em] uppercase">Instruo</span>
        <h2 class="max-w-2xl text-2xl font-semibold">{{ title }}</h2>
        <p class="max-w-2xl text-white/75">{{ description }}</p>
      </article>
    </div></ToolWorkbench
  >
</template>
