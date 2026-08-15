<script setup lang="ts">
const password = ref("");
const score = computed(() => {
  const value = password.value;
  if (!value) return 0;
  if (value.length < 8 || /^(.)\1+$/.test(value)) return 1;
  let points = Math.min(3, Math.floor(value.length / 6));
  if (/[a-z]/.test(value)) points += 1;
  if (/[A-Z]/.test(value)) points += 1;
  if (/\d/.test(value)) points += 1;
  if (/[^a-z\d]/i.test(value)) points += 1;
  if (/1234|abcd|qwerty|password|letmein/i.test(value)) points -= 2;
  if (/^(?:0123456789|abcdefghijklmnopqrstuvwxyz|qwertyuiop)$/i.test(value)) points = 1;
  return Math.max(1, Math.min(5, points));
});
const label = computed(
  () => ["Start typing", "Very guessable", "Weak", "Fair", "Good", "Strong"][score.value],
);
</script>
<template>
  <ToolWorkbench
    description="Check password length and character variety locally; the value is never stored."
  >
    <div class="grid max-w-xl gap-5">
      <UFormField
        label="Password"
        help="This runs locally. It is a heuristic, not a breach database lookup."
      >
        <UInput
          v-model="password"
          type="password"
          size="xl"
          placeholder="Type a password to check"
        />
      </UFormField>
      <UProgress
        :model-value="score"
        :max="5"
        color="primary"
      />
      <div class="flex items-baseline justify-between">
        <strong class="text-xl">{{ label }}</strong
        ><span class="text-muted text-sm">{{ password.length }} characters</span>
      </div>
      <UAlert
        icon="i-tabler-shield-check"
        color="info"
        title="Tip"
        description="Long, unique passphrases are easier to remember and harder to guess."
      />
    </div>
  </ToolWorkbench>
</template>
