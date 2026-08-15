<template>
  <div class="flex min-h-[100vh] w-full flex-col">
    <NuxtLink
      to="#main-content"
      class="bg-elevated text-highlighted focus:ring-primary ring-default shadow-menu fixed top-3 left-3 z-50 -translate-y-20 rounded-md px-4 py-2 ring-1 focus:translate-y-0 focus:ring-2 focus:outline-none"
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
