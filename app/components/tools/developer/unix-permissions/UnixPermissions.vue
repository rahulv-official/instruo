<script setup lang="ts">
const input = ref("755");
const result = computed(() => {
  if (!/^[0-7]{3}$/.test(input.value))
    return { symbolic: "", command: "", error: "Use three octal digits, such as 755." };
  const symbolic = [...input.value]
    .map((digit) =>
      [4, 2, 1].map((bit, index) => (Number(digit) & bit ? ["r", "w", "x"][index] : "-")).join(""),
    )
    .join("");
  return { symbolic, command: `chmod ${input.value} file`, error: "" };
});
</script>

<template>
  <ToolWorkbench
    description="Translate common three-digit Unix permissions into symbolic notation."
  >
    <div class="mx-auto grid max-w-xl gap-6">
      <UFormField
        label="Octal mode"
        description="Examples: 644, 755, 700."
        :error="result.error || undefined"
      >
        <UInput
          v-model="input"
          inputmode="numeric"
          maxlength="3"
          size="xl"
          class="w-full font-mono"
        />
      </UFormField>
      <div class="border-default/70 grid gap-3 border p-5">
        <span class="text-muted text-xs uppercase">Symbolic mode</span
        ><strong class="text-highlighted font-mono text-3xl">{{
          result.symbolic || "---------"
        }}</strong
        ><code class="text-toned text-sm">{{ result.command || "chmod 755 file" }}</code>
      </div>
    </div>
  </ToolWorkbench>
</template>
