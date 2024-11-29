<template>
  <HeroSection></HeroSection>
</template>

<script lang="ts" setup>
const config = useConfig();

useSeoMeta({
  title: `instruo.org: Open-source collection of tools and utilities.`,
  ogTitle: `instruo.org: Open-source collection of tools and utilities.`,
  description: "Open-source collection of tools and utilities.",
  ogDescription: "Open-source collection of tools and utilities.",
  ogImage: config.value.site.ogImage,
  twitterCard: "summary_large_image",
});
</script>
