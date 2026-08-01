<template>
  <div class="flex min-h-screen w-full flex-col">
    <NuxtLink
      to="#main-content"
      class="bg-default text-highlighted focus:ring-primary border-default fixed top-3 left-3 z-50 -translate-y-20 border px-4 py-2 focus:translate-y-0 focus:ring-2 focus:outline-none"
    >
      Skip to content
    </NuxtLink>

    <AppHeader />

    <UMain id="main-content">
      <slot />
    </UMain>

    <AppFooter />
  </div>
</template>
