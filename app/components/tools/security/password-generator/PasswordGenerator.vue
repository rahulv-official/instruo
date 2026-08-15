<script setup lang="ts">
type CharacterOption = "lowercase" | "numbers" | "symbols" | "uppercase";

const characterSets: Record<CharacterOption, string> = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};
const optionItems: { key: CharacterOption; label: string }[] = [
  { key: "lowercase", label: "Lowercase" },
  { key: "uppercase", label: "Uppercase" },
  { key: "numbers", label: "Numbers" },
  { key: "symbols", label: "Symbols" },
];

const length = ref(20);
const password = ref("");
const settings = reactive<Record<CharacterOption, boolean>>({
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
});
const { copyText } = useCopyToClipboard();

const enabledSets = computed(() =>
  optionItems.filter(({ key }) => settings[key]).map(({ key }) => characterSets[key]),
);
const pool = computed(() => enabledSets.value.join(""));
const entropyBits = computed(() => Math.floor(length.value * Math.log2(pool.value.length)));
const strength = computed(() => {
  if (entropyBits.value < 60) return { label: "Basic", color: "warning" as const };
  if (entropyBits.value < 90) return { label: "Strong", color: "success" as const };
  return { label: "Very strong", color: "success" as const };
});

function secureIndex(max: number) {
  const limit = 256 - (256 % max);
  const bytes = new Uint8Array(1);

  do crypto.getRandomValues(bytes);
  while (bytes[0]! >= limit);

  return bytes[0]! % max;
}

function generatePassword() {
  if (!pool.value || !globalThis.crypto) return;

  const characters = enabledSets.value.map((set) => set[secureIndex(set.length)]!);
  while (characters.length < length.value) {
    characters.push(pool.value[secureIndex(pool.value.length)]!);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex]!, characters[index]!];
  }

  password.value = characters.join("");
}

function setLength(value: number | null | undefined) {
  length.value = Math.min(128, Math.max(8, value ?? 20));
  generatePassword();
}

function setOption(key: CharacterOption, value: boolean) {
  const enabledCount = optionItems.filter((option) => settings[option.key]).length;
  if (!value && settings[key] && enabledCount === 1) return;
  settings[key] = value;
  generatePassword();
}

onMounted(generatePassword);
</script>

<template>
  <ToolWorkbench description="Generated with your browser's cryptographic random number generator.">
    <div class="grid gap-6">
      <div class="border-default/70 bg-muted/20 border p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <span class="text-toned font-mono text-xs">Generated password</span>
          <div class="flex items-center gap-2">
            <UBadge
              :label="strength.label"
              :color="strength.color"
              variant="soft"
              class="rounded-sm"
            />
            <span class="text-toned font-mono text-xs">{{ entropyBits }} bits</span>
          </div>
        </div>
        <output
          class="text-highlighted mt-6 block min-h-16 font-mono text-2xl leading-9 font-semibold break-all sm:text-3xl"
        >
          {{ password }}
        </output>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <UFormField
          label="Length"
          description="Between 8 and 128 characters."
          :ui="{ container: 'mt-2' }"
        >
          <UInputNumber
            :model-value="length"
            :min="8"
            :max="128"
            size="lg"
            class="w-full"
            @update:model-value="setLength"
          />
        </UFormField>

        <fieldset>
          <legend class="text-highlighted text-sm font-medium">Character sets</legend>
          <p class="text-muted mt-1 text-sm">Keep at least one set enabled.</p>
          <div class="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            <UCheckbox
              v-for="option in optionItems"
              :key="option.key"
              :model-value="settings[option.key]"
              :label="option.label"
              @update:model-value="setOption(option.key, Boolean($event))"
            />
          </div>
        </fieldset>
      </div>

      <div class="border-default/70 flex flex-wrap justify-end gap-2 border-t pt-5">
        <UButton
          label="Generate again"
          color="neutral"
          variant="ghost"
          icon="i-tabler-refresh"
          @click="generatePassword"
        />
        <UButton
          color="neutral"
          variant="soft"
          label="Copy password"
          icon="i-tabler-copy"
          :disabled="!password"
          @click="copyText(password)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
