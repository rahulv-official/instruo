<script setup lang="ts">
const { file, outputUrl, select, render, download } = useLocalImage();
async function process() {
  await render({ width: 64, height: 64, mime: "image/png" });
}
</script>
<template>
  <ToolWorkbench description="Create a 64-pixel favicon PNG from any image locally."
    ><div class="grid gap-5">
      <UInput
        type="file"
        accept="image/*"
        @change="select"
      />
      <div class="flex gap-2">
        <UButton
          label="Create favicon"
          icon="i-lucide-star"
          :disabled="!file"
          @click="process"
        /><UButton
          label="Download favicon"
          color="neutral"
          variant="outline"
          :disabled="!outputUrl"
          @click="download('favicon.png')"
        />
      </div>
      <img
        v-if="outputUrl"
        :src="outputUrl"
        alt="Generated favicon"
        class="border-default size-16 border object-contain"
      /></div
  ></ToolWorkbench>
</template>
