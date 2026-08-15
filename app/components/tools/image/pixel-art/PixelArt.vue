<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const pixelSize = ref(8);
const status = ref("Choose an image to begin.");
function render() {
  const element = canvas.value;
  const source = image.value;
  if (!element || !source) return;
  const max = 1200;
  const scale = Math.min(1, max / Math.max(source.naturalWidth, source.naturalHeight));
  const width = Math.round(source.naturalWidth * scale);
  const height = Math.round(source.naturalHeight * scale);
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) return;
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.ceil(width / Math.max(1, pixelSize.value)));
  small.height = Math.max(1, Math.ceil(height / Math.max(1, pixelSize.value)));
  const smallContext = small.getContext("2d");
  if (!smallContext) return;
  smallContext.imageSmoothingEnabled = false;
  smallContext.drawImage(source, 0, 0, small.width, small.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(small, 0, 0, small.width, small.height, 0, 0, width, height);
}
function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file?.type.startsWith("image/")) return;
  const next = new Image();
  next.onload = () => {
    image.value = next;
    render();
    status.value = "Adjust pixel size, then download the result.";
  };
  next.src = URL.createObjectURL(file);
}
function download() {
  canvas.value?.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pixel-art.png";
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
</script>

<template>
  <ToolWorkbench description="Convert an image into crisp pixel art with local canvas rendering.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
        <UFormField label="Image"
          ><input
            type="file"
            accept="image/*"
            class="border-muted bg-muted/20 text-default file:bg-elevated file:text-default w-full rounded-md border p-2 text-sm file:mr-3 file:rounded file:border-0 file:px-3 file:py-1.5"
            @change="onFile"
        /></UFormField>
        <UFormField label="Pixel size"
          ><UInput
            v-model.number="pixelSize"
            type="number"
            min="2"
            max="64"
            class="w-full"
            @update:model-value="render"
        /></UFormField>
      </div>
      <div class="border-muted bg-muted/20 overflow-auto rounded-md border p-3">
        <canvas
          ref="canvas"
          class="mx-auto block max-h-[65vh] max-w-full"
        />
        <p
          v-if="!image"
          class="text-muted py-16 text-center text-sm"
        >
          Pixel-art preview appears here.
        </p>
      </div>
      <div class="flex justify-end">
        <UButton
          label="Download PNG"
          icon="i-tabler-download"
          :disabled="!image"
          @click="download"
        />
      </div>
      <p
        class="text-muted text-sm"
        role="status"
      >
        {{ status }}
      </p>
    </div>
  </ToolWorkbench>
</template>
