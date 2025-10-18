<template>
  <div class="flex min-h-screen w-full flex-col">
    <AppHeader />

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator
      icon="i-simple-icons-nuxtdotjs"
      type="dashed"
      class="h-px"
    />

    <AppFooter />
  </div>
</template>
