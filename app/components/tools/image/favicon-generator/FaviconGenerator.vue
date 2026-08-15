<script setup lang="ts">
const { file, outputUrl, select, render, download } = useLocalImage();
async function process() {
  await render({ width: 64, height: 64, mime: "image/png" });
}
</script>
<template>
  <ToolWorkbench description="Create a 64-pixel favicon PNG from any image locally.">
    <div class="grid gap-5">
      <UFileUpload
        :model-value="file"
        accept="image/*"
        label="Choose source artwork"
        description="Drop a square image here or browse this device. PNG and SVG-style artwork work best."
        @update:model-value="select"
      />
      <div class="flex gap-2">
        <UButton
          label="Create favicon"
          icon="i-tabler-star"
          :disabled="!file"
          @click="process"
        /><UButton
          color="neutral"
          variant="soft"
          label="Download favicon"
          :disabled="!outputUrl"
          @click="download('favicon.png')"
        />
      </div>
      <img
        v-if="outputUrl"
        :src="outputUrl"
        alt="Generated favicon"
        class="border-default size-16 border object-contain"
      />
    </div>
  </ToolWorkbench>
</template>
