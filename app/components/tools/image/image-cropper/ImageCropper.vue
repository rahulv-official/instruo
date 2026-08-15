<script setup lang="ts">
const { file, outputUrl, width, height, select, render, download } = useLocalImage();
const x = ref(0);
const y = ref(0);
const cropWidth = ref(0);
const cropHeight = ref(0);
function syncSize() {
  cropWidth.value = width.value;
  cropHeight.value = height.value;
}
async function process() {
  await render({
    x: x.value,
    y: y.value,
    width: cropWidth.value,
    height: cropHeight.value,
    crop: true,
    mime: "image/png",
  });
}
</script>
<template>
  <ToolWorkbench description="Crop an image by pixel coordinates in your browser.">
    <div class="grid gap-5">
      <UFileUpload
        :model-value="file"
        accept="image/*"
        label="Choose an image"
        description="Drop an image here or browse this device. Up to 25 MB."
        @update:model-value="
          async (nextFile) => {
            await select(nextFile);
            syncSize();
          }
        "
      />
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="X">
          <UInput
            v-model.number="x"
            type="number"
            min="0"
          /> </UFormField
        ><UFormField label="Y">
          <UInput
            v-model.number="y"
            type="number"
            min="0"
          /> </UFormField
        ><UFormField label="Width">
          <UInput
            v-model.number="cropWidth"
            type="number"
            min="1"
          /> </UFormField
        ><UFormField label="Height">
          <UInput
            v-model.number="cropHeight"
            type="number"
            min="1"
          />
        </UFormField>
      </div>
      <div class="flex gap-2">
        <UButton
          label="Crop"
          icon="i-tabler-crop"
          :disabled="!file"
          @click="process"
        /><UButton
          color="neutral"
          variant="soft"
          label="Download"
          :disabled="!outputUrl"
          @click="download('cropped-image.png')"
        />
      </div>
      <img
        v-if="outputUrl"
        :src="outputUrl"
        alt="Cropped image"
        class="border-default max-h-72 w-fit border object-contain"
      />
    </div>
  </ToolWorkbench>
</template>
