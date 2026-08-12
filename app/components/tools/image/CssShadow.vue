<script setup lang="ts">
const x = ref(0);
const y = ref(8);
const blur = ref(24);
const spread = ref(0);
const color = ref("#00000033");
const output = computed(
  () => `box-shadow: ${x.value}px ${y.value}px ${blur.value}px ${spread.value}px ${color.value};`,
);
const { copyText } = useCopyToClipboard();
</script>
<template>
  <ToolWorkbench description="Build a copy-ready box-shadow declaration with a live preview."
    ><div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="X"
          ><UInput
            v-model.number="x"
            type="number" /></UFormField
        ><UFormField label="Y"
          ><UInput
            v-model.number="y"
            type="number" /></UFormField
        ><UFormField label="Blur"
          ><UInput
            v-model.number="blur"
            type="number" /></UFormField
        ><UFormField label="Spread"
          ><UInput
            v-model.number="spread"
            type="number" /></UFormField
        ><UFormField label="Color"><UInput v-model="color" /></UFormField>
      </div>
      <div class="border-default bg-elevated grid min-h-32 place-items-center border">
        <div
          class="bg-default size-24"
          :style="{ boxShadow: `${x}px ${y}px ${blur}px ${spread}px ${color}` }"
        />
      </div>
      <UInput
        :model-value="output"
        readonly
        class="font-mono"
      /><UButton
        label="Copy CSS"
        icon="i-lucide-copy"
        class="w-fit"
        @click="copyText(output)"
      /></div
  ></ToolWorkbench>
</template>
