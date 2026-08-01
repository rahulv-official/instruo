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

const groupedItems = computed(() => {
  const groups = new Map<string, ResourceItem[]>();

  for (const item of props.items.toSorted((a, b) => a.title.localeCompare(b.title))) {
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
  <div class="border-default/70 mb-8 border-b pb-6 lg:hidden">
    <UFormField :label="`Open another ${kind}`">
      <USelect
        :model-value="currentPath"
        :items="selectItems"
        value-key="value"
        label-key="label"
        size="lg"
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
        class="text-highlighted focus-visible:ring-primary mb-5 flex items-center gap-2 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4"
        />
        All {{ kind === "tool" ? "tools" : "games" }}
      </NuxtLink>

      <div
        v-for="[category, resources] in groupedItems"
        :key="category"
        class="mb-4"
      >
        <p class="text-toned mb-1.5 font-mono text-[0.7rem]">{{ category }}</p>
        <div class="grid gap-0.5">
          <NuxtLink
            v-for="resource in resources"
            :key="resource.id"
            :to="resource.path"
            class="focus-visible:ring-primary flex min-h-9 items-center gap-2.5 border-l-2 px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            :class="
              resource.path === currentPath
                ? 'border-primary bg-elevated/50 text-highlighted font-medium'
                : 'text-muted hover:border-default hover:bg-elevated/30 hover:text-highlighted border-transparent'
            "
            :aria-current="resource.path === currentPath ? 'page' : undefined"
          >
            <UIcon
              :name="resource.icon || (kind === 'tool' ? 'i-lucide-wrench' : 'i-lucide-gamepad-2')"
              class="size-4 shrink-0"
            />
            <span>{{ resource.title }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </aside>
</template>
