<script setup lang="ts">
const result = ref("");
const error = ref("");
const scanning = ref(false);
const selectedFile = shallowRef<File | null>(null);
async function scan(file: File | null | undefined) {
  selectedFile.value = file ?? null;
  if (!file) {
    result.value = "";
    error.value = "";
    return;
  }
  result.value = "";
  error.value = "";
  scanning.value = true;
  try {
    const BarcodeDetectorCtor = (
      globalThis as typeof globalThis & {
        BarcodeDetector?: new (options?: { formats: string[] }) => {
          detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;
    if (!BarcodeDetectorCtor) throw new Error("BarcodeDetector is not supported in this browser.");
    const bitmap = await createImageBitmap(file);
    const detections = await new BarcodeDetectorCtor({ formats: ["qr_code"] }).detect(bitmap);
    bitmap.close();
    result.value = detections[0]?.rawValue ?? "No QR code found in that image.";
  } catch (scanError) {
    error.value = scanError instanceof Error ? scanError.message : "Could not scan this image.";
  } finally {
    scanning.value = false;
  }
}
</script>

<template>
  <ToolWorkbench description="Scan a QR code from an image using your browser's native detector.">
    <div class="grid max-w-xl gap-5">
      <UFileUpload
        :model-value="selectedFile"
        accept="image/*"
        label="Choose a QR image"
        description="Drop a screenshot or image here, or browse this device. Nothing is uploaded."
        @update:model-value="scan"
      />
      <UAlert
        v-if="scanning"
        color="neutral"
        variant="subtle"
        title="Scanning…"
      />
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        title="Scanner unavailable"
        :description="error"
      />
      <UTextarea
        v-if="result"
        :model-value="result"
        :rows="4"
        readonly
        aria-label="QR result"
      />
    </div>
  </ToolWorkbench>
</template>
