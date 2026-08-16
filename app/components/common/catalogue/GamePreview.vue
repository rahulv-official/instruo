<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    path: string;
    title: string;
    category: string;
    icon?: string;
    art?: string;
    featured?: boolean;
  }>(),
  { icon: "i-tabler-device-gamepad-2", featured: false },
);

const slug = computed(() => props.path.split("/").at(-1) ?? "");
const source = computed(() => props.art || `/game-arts/${slug.value}.jpg`);
</script>

<template>
  <div
    class="bg-muted relative isolate h-full min-h-40 overflow-hidden"
    aria-hidden="true"
  >
    <NuxtImg
      :src="source"
      alt=""
      width="1280"
      height="720"
      :loading="featured ? 'eager' : 'lazy'"
      sizes="sm:100vw md:50vw lg:33vw xl:25vw"
      class="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
    />
    <span
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(0_0_0/0.1)_100%)]"
    />
  </div>
</template>
