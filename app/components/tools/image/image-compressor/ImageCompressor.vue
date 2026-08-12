<script setup lang="ts">
const { file, sourceUrl, outputUrl, width, height, select, render, download } = useLocalImage();
const format = ref("image/webp");
const quality = ref(0.82);
const processing = ref(false);
async function process() {
  processing.value = true;
  try {
    await render({ mime: format.value, quality: quality.value });
  } finally {
    processing.value = false;
  }
}
</script>
<template>
  <ToolWorkbench description="Compress JPEG, PNG, or WebP images locally with Canvas."
    ><div class="grid gap-5">
      <UInput
        type="file"
        accept="image/*"
        @change="select"
      />
      <div
        v-if="file"
        class="text-muted grid gap-3 text-sm"
      >
        <span>{{ file.name }} · {{ width }} × {{ height }} px</span
        ><img
          :src="sourceUrl"
          alt="Selected source"
          class="border-default max-h-64 w-fit border object-contain"
        />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Output format"
          ><USelect
            v-model="format"
            :items="[
              { label: 'WebP', value: 'image/webp' },
              { label: 'JPEG', value: 'image/jpeg' },
              { label: 'PNG', value: 'image/png' },
            ]"
            value-key="value"
            label-key="label" /></UFormField
        ><UFormField label="Quality"
          ><UInput
            v-model.number="quality"
            type="number"
            min="0.1"
            max="1"
            step="0.05"
        /></UFormField>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Compress image"
          icon="i-lucide-image-down"
          :loading="processing"
          :disabled="!file"
          @click="process"
        /><UButton
          label="Download"
          color="neutral"
          variant="outline"
          :disabled="!outputUrl"
          @click="download(`compressed-image.${format.split('/')[1]}`)"
        />
      </div>
      <img
        v-if="outputUrl"
        :src="outputUrl"
        alt="Compressed result"
        class="border-default max-h-64 w-fit border object-contain"
      /></div
  ></ToolWorkbench>
</template>
