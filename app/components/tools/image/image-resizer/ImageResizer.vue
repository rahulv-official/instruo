<script setup lang="ts">
type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

const formatItems: { label: string; value: OutputFormat }[] = [
  { label: "WebP", value: "image/webp" },
  { label: "JPEG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
];

const sourceFile = shallowRef<File | null>(null);
const outputBlob = shallowRef<Blob | null>(null);
const sourceUrl = ref("");
const outputUrl = ref("");
const sourceWidth = ref(0);
const sourceHeight = ref(0);
const targetWidth = ref(0);
const format = ref<OutputFormat>("image/webp");
const quality = ref(82);
const processing = ref(false);
const errorMessage = ref("");

const outputHeight = computed(() => {
  if (!sourceWidth.value || !sourceHeight.value || !targetWidth.value) return 0;
  return Math.max(1, Math.round((sourceHeight.value / sourceWidth.value) * targetWidth.value));
});
const outputExtension = computed(() => {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[format.value];
});
const downloadName = computed(() => {
  const baseName = sourceFile.value?.name.replace(/\.[^.]+$/, "") || "resized-image";
  return `${baseName}-${targetWidth.value}x${outputHeight.value}.${outputExtension.value}`;
});

function formatBytes(value: number) {
  if (value < 1_024) return `${value} B`;
  if (value < 1_048_576) return `${(value / 1_024).toFixed(1)} KB`;
  return `${(value / 1_048_576).toFixed(2)} MB`;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be decoded."));
    image.src = url;
  });
}

function releaseOutput() {
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value);
  outputUrl.value = "";
  outputBlob.value = null;
}

async function selectImage(file: File | null | undefined) {
  if (!file) {
    if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
    releaseOutput();
    sourceFile.value = null;
    sourceUrl.value = "";
    sourceWidth.value = 0;
    sourceHeight.value = 0;
    targetWidth.value = 0;
    errorMessage.value = "";
    return;
  }

  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
  releaseOutput();
  errorMessage.value = "";
  sourceFile.value = file;
  sourceUrl.value = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl.value);
    sourceWidth.value = image.naturalWidth;
    sourceHeight.value = image.naturalHeight;
    targetWidth.value = image.naturalWidth;
    await createImage();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "This image could not be read.";
  }
}

function setWidth(value: number | null | undefined) {
  targetWidth.value = Math.min(8_192, Math.max(1, value ?? sourceWidth.value));
  releaseOutput();
}

function setQuality(value: number | null | undefined) {
  quality.value = Math.min(100, Math.max(10, value ?? 82));
  releaseOutput();
}

function setFormat(value: string | undefined) {
  if (!formatItems.some((item) => item.value === value)) return;
  format.value = value as OutputFormat;
  releaseOutput();
}

async function createImage() {
  if (!sourceUrl.value || !targetWidth.value || !outputHeight.value) return;
  processing.value = true;
  errorMessage.value = "";
  releaseOutput();

  try {
    const image = await loadImage(sourceUrl.value);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth.value;
    canvas.height = outputHeight.value;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("The image could not be exported."))),
        format.value,
        format.value === "image/png" ? undefined : quality.value / 100,
      );
    });
    outputBlob.value = blob;
    outputUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "The image could not be resized.";
  } finally {
    processing.value = false;
  }
}

function downloadImage() {
  if (!outputUrl.value) return;
  const link = document.createElement("a");
  link.href = outputUrl.value;
  link.download = downloadName.value;
  link.click();
}

onUnmounted(() => {
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
  releaseOutput();
});
</script>

<template>
  <ToolWorkbench
    description="Resize and compress JPEG, PNG, or WebP images without uploading them."
  >
    <div class="grid gap-6">
      <UFormField
        label="Source image"
        description="Choose a JPEG, PNG, or WebP file from this device."
        :error="errorMessage || undefined"
        :ui="{ container: 'mt-2' }"
      >
        <UFileUpload
          :model-value="sourceFile"
          accept="image/jpeg,image/png,image/webp"
          size="lg"
          label="Choose an image"
          description="Drop a JPEG, PNG, or WebP here, or browse this device."
          @update:model-value="selectImage"
        />
      </UFormField>

      <div
        v-if="sourceFile"
        class="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start"
      >
        <div class="grid gap-5">
          <UFormField
            label="Width"
            :description="`Height stays proportional: ${outputHeight || 0}px.`"
            :ui="{ container: 'mt-2' }"
          >
            <UInputNumber
              :model-value="targetWidth"
              :min="1"
              :max="8192"
              size="lg"
              class="w-full"
              @update:model-value="setWidth"
            />
          </UFormField>

          <UFormField
            label="Output format"
            :ui="{ container: 'mt-2' }"
          >
            <USelect
              :model-value="format"
              :items="formatItems"
              value-key="value"
              label-key="label"
              size="lg"
              class="w-full"
              :ui="{ base: 'rounded-md', content: 'rounded-md', item: 'before:rounded-md' }"
              @update:model-value="setFormat"
            />
          </UFormField>

          <UFormField
            label="Quality"
            :description="
              format === 'image/png'
                ? 'PNG is lossless, so quality is ignored.'
                : 'Lower values create smaller files with less detail.'
            "
            :ui="{ container: 'mt-2' }"
          >
            <UInputNumber
              :model-value="quality"
              :min="10"
              :max="100"
              :disabled="format === 'image/png'"
              size="lg"
              class="w-full"
              @update:model-value="setQuality"
            />
          </UFormField>

          <UButton
            label="Create resized image"
            icon="i-tabler-photo-down"
            size="lg"
            :loading="processing"
            @click="createImage"
          />
        </div>

        <div
          class="border-default/70 bg-muted/20 flex min-h-80 items-center justify-center border p-4"
        >
          <!-- eslint-disable vue/html-self-closing -->
          <img
            v-if="outputUrl"
            :src="outputUrl"
            :alt="`Resized preview at ${targetWidth} by ${outputHeight} pixels`"
            class="max-h-[32rem] max-w-full object-contain"
          />
          <!-- eslint-enable vue/html-self-closing -->
          <div
            v-else
            class="text-muted grid justify-items-center gap-3 text-center text-sm"
          >
            <UIcon
              name="i-tabler-photo"
              class="size-8"
            />
            <p>Create the image to see its preview.</p>
          </div>
        </div>
      </div>

      <div
        v-if="sourceFile"
        class="border-default/70 grid gap-4 border-t pt-5 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <p class="text-muted text-sm leading-6">
          Source: {{ sourceWidth }} × {{ sourceHeight }}, {{ formatBytes(sourceFile.size) }}
          <template v-if="outputBlob">
            / Output: {{ targetWidth }} × {{ outputHeight }}, {{ formatBytes(outputBlob.size) }}
          </template>
        </p>
        <UButton
          color="neutral"
          variant="soft"
          label="Download image"
          icon="i-tabler-download"
          :disabled="!outputUrl"
          @click="downloadImage"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
