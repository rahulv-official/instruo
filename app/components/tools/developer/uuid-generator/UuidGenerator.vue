<script setup lang="ts">
import { v1, v3, v4, v5, v6, v7 } from "uuid";

type UuidVersion = "v1" | "v3" | "v4" | "v5" | "v6" | "v7";
type NamespacePreset = "dns" | "url";

const versionItems = [
  { label: "UUID v1", value: "v1" },
  { label: "UUID v3", value: "v3" },
  { label: "UUID v4", value: "v4" },
  { label: "UUID v5", value: "v5" },
  { label: "UUID v6", value: "v6" },
  { label: "UUID v7", value: "v7" },
];
const namespaceItems = [
  { label: "URL namespace", value: "url" },
  { label: "DNS namespace", value: "dns" },
];
const versionDescriptions: Record<UuidVersion, string> = {
  v1: "Time-based UUID with a random node identifier.",
  v3: "Deterministic UUID generated from a name using MD5.",
  v4: "Random UUID generated with a cryptographic random source.",
  v5: "Deterministic UUID generated from a name using SHA-1.",
  v6: "Reordered time-based UUID designed for database locality.",
  v7: "Unix timestamp UUID designed for sortable records.",
};

const count = ref(1);
const version = ref<UuidVersion>("v4");
const name = ref("https://example.com");
const namespacePreset = ref<NamespacePreset>("url");
const ids = shallowRef<string[]>([]);
const { copyText } = useCopyToClipboard();

const isNameBased = computed(() => version.value === "v3" || version.value === "v5");
const output = computed(() => ids.value.join("\n"));
const description = computed(() => versionDescriptions[version.value]);

function createUuid() {
  switch (version.value) {
    case "v1":
      return v1();
    case "v3":
      return v3(name.value, namespacePreset.value === "dns" ? v3.DNS : v3.URL);
    case "v4":
      return v4();
    case "v5":
      return v5(name.value, namespacePreset.value === "dns" ? v5.DNS : v5.URL);
    case "v6":
      return v6();
    case "v7":
      return v7();
  }
}

function generate() {
  const total = isNameBased.value ? 1 : count.value;
  ids.value = Array.from({ length: total }, createUuid);
}

function selectVersion(value: string) {
  version.value = value as UuidVersion;
  generate();
}

onMounted(generate);
</script>

<template>
  <ToolWorkbench :description="description">
    <div class="grid gap-6">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-[12rem_1fr_auto] lg:items-end">
        <UFormField
          label="UUID version"
          description="Choose the format you need."
        >
          <USelect
            :model-value="version"
            :items="versionItems"
            class="w-full"
            @update:model-value="selectVersion"
          />
        </UFormField>

        <template v-if="isNameBased">
          <UFormField
            label="Name"
            description="The same name and namespace always return the same UUID."
          >
            <UInput
              v-model="name"
              class="w-full"
              placeholder="https://example.com"
            />
          </UFormField>
          <UFormField
            label="Namespace"
            description="Use URL or DNS semantics."
          >
            <USelect
              v-model="namespacePreset"
              :items="namespaceItems"
              class="w-48"
            />
          </UFormField>
        </template>

        <UFormField
          v-else
          label="Number of UUIDs"
          description="Generate up to 50 at once."
        >
          <UInputNumber
            v-model="count"
            :min="1"
            :max="50"
            class="w-40"
          />
        </UFormField>

        <UButton
          label="Generate"
          icon="i-lucide-refresh-cw"
          size="lg"
          @click="generate"
        />
      </div>

      <UFormField :label="`UUID ${version} output`">
        <UTextarea
          :model-value="output"
          readonly
          :rows="Math.min(Math.max(isNameBased ? 1 : count, 5), 15)"
          class="w-full"
          :ui="{ base: 'rounded-none font-mono text-sm leading-7' }"
        />
      </UFormField>

      <div class="flex justify-end">
        <UButton
          label="Copy output"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          :disabled="!output"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
