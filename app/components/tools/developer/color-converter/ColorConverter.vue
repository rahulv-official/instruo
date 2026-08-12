<script setup lang="ts">
const input = ref("#f97316");
const result = computed(() => {
  const match = input.value.trim().match(/^#?([\da-f]{6})$/i);
  if (!match) return { error: "Enter a six-digit hex color.", rgb: "", hsl: "" };
  const hex = match[1]!;
  const values = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const [r, g, b] = values;
  const max = Math.max(r!, g!, b!) / 255;
  const min = Math.min(r!, g!, b!) / 255;
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max !== min) {
    const normalized =
      max === r! / 255
        ? (g! - b!) / 255 / (max - min)
        : max === g! / 255
          ? 2 + (b! - r!) / 255 / (max - min)
          : 4 + (r! - g!) / 255 / (max - min);
    hue = Math.round((normalized < 0 ? normalized + 6 : normalized) * 60);
  }
  return {
    error: "",
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${hue}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`,
  };
});
</script>

<template>
  <ToolWorkbench description="Convert a six-digit hex color to RGB and HSL values locally.">
    <div class="mx-auto grid max-w-xl gap-6">
      <UFormField
        label="Hex color"
        :error="result.error || undefined"
      >
        <UInput
          v-model="input"
          size="xl"
          class="w-full font-mono"
          placeholder="#f97316"
        />
      </UFormField>
      <dl class="border-default/70 grid border-t border-l sm:grid-cols-2">
        <div class="border-default/70 grid gap-2 border-r border-b p-5">
          <dt class="text-muted text-xs uppercase">RGB</dt>
          <dd class="text-highlighted font-mono">{{ result.rgb || "—" }}</dd>
        </div>
        <div class="border-default/70 grid gap-2 border-r border-b p-5">
          <dt class="text-muted text-xs uppercase">HSL</dt>
          <dd class="text-highlighted font-mono">{{ result.hsl || "—" }}</dd>
        </div>
      </dl>
    </div>
  </ToolWorkbench>
</template>
