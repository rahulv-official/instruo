<script setup lang="ts">
const file = shallowRef<File | null>(null);
const previewUrl = ref("");
const metadata = ref<Record<string, string>>({});
const error = ref("");

function readExif(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const u16 = (position: number) => view.getUint16(position, little);
      const u32 = (position: number) => view.getUint32(position, little);
      const typeSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
      const names: Record<number, string> = {
        0x010f: "Make",
        0x0110: "Model",
        0x0132: "DateTime",
        0x9003: "DateTimeOriginal",
        0x0112: "Orientation",
        0xa002: "PixelWidth",
        0xa003: "PixelHeight",
        0x0131: "Software",
      };
      const result: Record<string, string> = {};
      const ifd = tiff + u32(tiff + 4);
      const entries = u16(ifd);
      for (let index = 0; index < entries; index += 1) {
        const entry = ifd + 2 + index * 12;
        const tag = u16(entry);
        const type = u16(entry + 2);
        const count = u32(entry + 4);
        const size = (typeSize[type] ?? 1) * count;
        const valueOffset = size <= 4 ? entry + 8 : tiff + u32(entry + 8);
        const name = names[tag];
        if (!name) continue;
        if (type === 2) {
          let text = "";
          for (
            let character = 0;
            character < count && view.getUint8(valueOffset + character);
            character += 1
          )
            text += String.fromCharCode(view.getUint8(valueOffset + character));
          result[name] = text;
        } else if (type === 3) result[name] = String(u16(valueOffset));
        else if (type === 4) result[name] = String(u32(valueOffset));
      }
      return result;
    }
    offset += 2 + length;
  }
  return {};
}

async function select(next: File | null | undefined) {
  if (!next) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    file.value = null;
    previewUrl.value = "";
    metadata.value = {};
    error.value = "";
    return;
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = next;
  previewUrl.value = URL.createObjectURL(next);
  error.value = "";
  try {
    metadata.value = {
      File: next.name,
      Type: next.type || "Unknown",
      Size: `${(next.size / 1024).toFixed(1)} KB`,
      ...readExif(await next.arrayBuffer()),
    };
  } catch {
    metadata.value = {
      File: next.name,
      Type: next.type || "Unknown",
      Size: `${(next.size / 1024).toFixed(1)} KB`,
    };
    error.value = "The image could not be inspected.";
  }
}

function downloadClean() {
  if (!previewUrl.value || !file.value) return;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")?.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `clean-${file.value?.name ?? "image.png"}`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");
  };
  image.src = previewUrl.value;
}
onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>

<template>
  <ToolWorkbench
    description="Inspect common JPEG EXIF fields locally. Images stay in your browser."
  >
    <div class="grid gap-5">
      <UFileUpload
        :model-value="file"
        accept="image/*"
        label="Choose a photo"
        description="Drop a JPEG here or browse this device. Metadata is inspected locally."
        @update:model-value="select"
      />
      <UAlert
        v-if="error"
        color="warning"
        variant="subtle"
        icon="i-tabler-alert-triangle"
        title="Limited metadata"
        :description="error"
      />
      <div
        v-if="file"
        class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.6fr)]"
      >
        <img
          :src="previewUrl"
          :alt="file.name"
          class="border-default max-h-80 w-full rounded-md border object-contain"
        />
        <dl class="divide-default border-default divide-y overflow-hidden rounded-lg border-y">
          <div
            v-for="(value, key) in metadata"
            :key="key"
            class="flex justify-between gap-4 py-2 text-sm"
          >
            <dt class="text-muted">{{ key }}</dt>
            <dd class="text-highlighted text-right">{{ value }}</dd>
          </div>
        </dl>
      </div>
      <UButton
        color="neutral"
        variant="soft"
        label="Download without metadata"
        icon="i-tabler-download"
        class="w-fit"
        :disabled="!file"
        @click="downloadClean"
      />
    </div>
  </ToolWorkbench>
</template>
