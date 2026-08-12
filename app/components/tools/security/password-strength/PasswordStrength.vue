<script setup lang="ts">
const password = ref("");
const score = computed(() => {
  let value = password.value.length >= 12 ? 2 : password.value.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(password.value)) value += 1;
  if (/[A-Z]/.test(password.value)) value += 1;
  if (/\d/.test(password.value)) value += 1;
  if (/[^a-z\d]/i.test(password.value)) value += 1;
  return Math.min(5, value);
});
const label = computed(
  () => ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"][score.value],
);
</script>
<template>
  <ToolWorkbench
    description="Check password length and character variety locally; the value is never stored."
    ><div class="grid max-w-xl gap-5">
      <UInput
        v-model="password"
        type="password"
        size="xl"
        placeholder="Type a password to check"
      /><UProgress
        :model-value="score"
        :max="5"
        color="primary"
      />
      <div class="flex items-baseline justify-between">
        <strong class="text-xl">{{ label }}</strong
        ><span class="text-muted text-sm">{{ password.length }} characters</span>
      </div>
      <UAlert
        icon="i-lucide-shield-check"
        color="info"
        title="Tip"
        description="Long, unique passphrases are easier to remember and harder to guess."
      /></div
  ></ToolWorkbench>
</template>
