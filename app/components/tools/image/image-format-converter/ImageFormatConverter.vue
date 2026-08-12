<script setup lang="ts">
const { file, outputUrl, select, render, download } = useLocalImage();
const format = ref("image/webp");
async function process() {
  await render({ mime: format.value, quality: 0.9 });
}
</script>
<template>
  <ToolWorkbench description="Convert images between PNG, JPEG, and WebP without uploading them."
    ><div class="grid gap-5">
      <UInput
        type="file"
        accept="image/*"
        @change="select"
      /><USelect
        v-model="format"
        :items="[
          { label: 'WebP', value: 'image/webp' },
          { label: 'JPEG', value: 'image/jpeg' },
          { label: 'PNG', value: 'image/png' },
        ]"
        value-key="value"
        label-key="label"
        class="w-full sm:max-w-xs"
      />
      <div class="flex gap-2">
        <UButton
          label="Convert"
          icon="i-lucide-refresh-cw"
          :disabled="!file"
          @click="process"
        /><UButton
          label="Download"
          color="neutral"
          variant="outline"
          :disabled="!outputUrl"
          @click="download(`converted-image.${format.split('/')[1]}`)"
        />
      </div>
      <img
        v-if="outputUrl"
        :src="outputUrl"
        alt="Converted image"
        class="border-default max-h-72 w-fit border object-contain"
      /></div
  ></ToolWorkbench>
</template>
