<script setup lang="ts">
const input = ref("Design review\nShip release\nTake a break");
const noRepeat = ref(true);
const remaining = ref<string[]>([]);
const picked = ref("");
const history = ref<string[]>([]);
const { copyText } = useCopyToClipboard();
const options = computed(() =>
  input.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean),
);
function pick() {
  const pool = noRepeat.value
    ? remaining.value.length
      ? remaining.value
      : options.value.filter((item) => !history.value.includes(item))
    : options.value;
  if (!pool.length) {
    picked.value = "Add more choices or reset history.";
    return;
  }
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  const item = pool[bytes[0]! % pool.length]!;
  picked.value = item;
  history.value.unshift(item);
  remaining.value = noRepeat.value ? pool.filter((candidate) => candidate !== item) : [];
}
function reset() {
  picked.value = "";
  history.value = [];
  remaining.value = [];
}
</script>

<template>
  <ToolWorkbench
    description="Pick a fair result from names, tasks, or choices without sending the list anywhere."
  >
    <div class="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(18rem,1.2fr)]">
      <div class="grid gap-4">
        <UFormField
          label="Choices"
          help="One choice per line"
          ><UTextarea
            v-model="input"
            :rows="14"
            class="w-full" /></UFormField
        ><UCheckbox
          v-model="noRepeat"
          label="Avoid repeats until every choice is picked"
        />
      </div>
      <div class="grid content-start gap-4">
        <div class="border-muted bg-muted/20 rounded-md border p-6 text-center">
          <p class="text-muted text-xs font-medium tracking-[0.14em] uppercase">Selected</p>
          <p class="text-highlighted mt-4 min-h-12 text-3xl font-semibold">
            {{ picked || "Ready when you are" }}
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <UButton
            label="Pick one"
            icon="i-tabler-dice-5"
            size="lg"
            :disabled="!options.length"
            @click="pick"
          /><UButton
            label="Reset"
            icon="i-tabler-refresh"
            color="neutral"
            variant="outline"
            @click="reset"
          />
        </div>
        <div
          v-if="history.length"
          class="border-muted rounded-md border p-4"
        >
          <div class="flex items-center justify-between">
            <p class="font-medium">History</p>
            <UButton
              label="Copy"
              icon="i-tabler-copy"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="copyText(history.join('\n'))"
            />
          </div>
          <p class="text-muted mt-2 text-sm">{{ history.join(" · ") }}</p>
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
