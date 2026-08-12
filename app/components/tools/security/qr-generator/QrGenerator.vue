<script setup lang="ts">
import QRCode from "qrcode";
import { downloadDataUrl } from "~/utils/browser-tools";
const value = ref("https://instruo.dev");
const image = ref("");
async function generate() {
  image.value = await QRCode.toDataURL(value.value || "Instruo", {
    width: 360,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
</script>
<template>
  <ToolWorkbench
    description="Create a downloadable QR code from text or a URL entirely in your browser."
    ><div class="grid gap-5">
      <UInput
        v-model="value"
        size="xl"
        placeholder="Text or URL"
      />
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Generate QR"
          icon="i-lucide-scan"
          @click="generate"
        /><UButton
          label="Download PNG"
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          :disabled="!image"
          @click="downloadDataUrl(image, 'qr-code.png')"
        />
      </div>
      <img
        v-if="image"
        :src="image"
        alt="Generated QR code"
        class="border-default size-72 border bg-white p-3"
      /></div
  ></ToolWorkbench>
</template>
