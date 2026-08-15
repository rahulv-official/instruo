<script setup lang="ts">
interface ResourceItem {
  id: string;
  path: string;
  title: string;
  category: string;
  icon?: string;
}

const props = defineProps<{
  items: ResourceItem[];
  currentPath: string;
  kind: "game" | "tool";
}>();

const search = ref("");

const visibleItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.items;
  return props.items.filter((item) =>
    [item.title, item.category].join(" ").toLowerCase().includes(query),
  );
});

const groupedItems = computed(() => {
  const groups = new Map<string, ResourceItem[]>();

  for (const item of visibleItems.value.toSorted((a, b) => a.title.localeCompare(b.title))) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }

  return [...groups.entries()].toSorted(([a], [b]) => a.localeCompare(b));
});

const selectItems = computed(() =>
  props.items
    .toSorted((a, b) => a.title.localeCompare(b.title))
    .map((item) => ({ label: item.title, value: item.path })),
);

function openResource(path: string | undefined) {
  if (path && path !== props.currentPath) navigateTo(path);
}
</script>

<template>
  <div class="border-muted mb-8 border-b pb-6 lg:hidden">
    <UFormField :label="`Open another ${kind}`">
      <USelectMenu
        :model-value="currentPath"
        :items="selectItems"
        value-key="value"
        label-key="label"
        size="lg"
        :search-input="{ placeholder: `Search ${kind}s…` }"
        class="w-full"
        @update:model-value="openResource"
      />
    </UFormField>
  </div>

  <aside class="hidden lg:block">
    <nav
      :aria-label="`${kind === 'tool' ? 'Tool' : 'Game'} navigation`"
      class="sticky top-20 max-h-[calc(100dvh-5.5rem)] overflow-y-auto pr-1"
    >
      <NuxtLink
        :to="kind === 'tool' ? '/tools' : '/games'"
        class="text-highlighted focus-visible:outline-primary hover:bg-elevated mb-4 flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-semibold focus-visible:outline-2"
      >
        <UIcon
          name="i-tabler-arrow-left"
          class="size-4"
        />
        All {{ kind === "tool" ? "tools" : "games" }}
      </NuxtLink>

      <UInput
        v-model="search"
        icon="i-tabler-search"
        :placeholder="`Filter ${kind}s…`"
        :aria-label="`Filter ${kind} navigation`"
        size="sm"
        class="mb-5 w-full"
      />

      <p
        v-if="!groupedItems.length"
        class="text-muted border-muted bg-elevated rounded-md border p-3 text-sm"
      >
        No matching {{ kind }}s.
      </p>

      <div
        v-for="[category, resources] in groupedItems"
        :key="category"
        class="mb-5"
      >
        <p class="text-toned mb-1.5 px-2 text-xs font-medium">{{ category }}</p>
        <div class="grid gap-0.5">
          <NuxtLink
            v-for="resource in resources"
            :key="resource.id"
            :to="resource.path"
            class="focus-visible:outline-primary flex min-h-9 items-center gap-2.5 rounded-md border-l-2 px-2.5 py-1.5 text-sm transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2"
            :class="
              resource.path === currentPath
                ? 'border-primary bg-elevated text-highlighted font-medium'
                : 'text-muted hover:bg-elevated hover:text-highlighted border-transparent'
            "
            :aria-current="resource.path === currentPath ? 'page' : undefined"
          >
            <UIcon
              :name="
                resource.icon || (kind === 'tool' ? 'i-tabler-tools' : 'i-tabler-device-gamepad-2')
              "
              class="size-4 shrink-0"
            />
            <span>{{ resource.title }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </aside>
</template>
