<template>
  <div
    class="relative -mt-14 flex size-full h-screen min-h-full flex-col items-center justify-center font-heading"
  >
    <!-- Background -->
    <Vortex
      background-color="black"
      :range-y="800"
      :particle-count="500"
      class="flex size-full flex-col items-center justify-center px-2 py-4 md:px-10"
    >
      <div class="-mt-32 flex w-52 flex-col items-center justify-center">
        <ParticleImage
          image-src="/logo-dark.png"
          :responsive-width="true"
          :canvas-height="300"
        />
      </div>
      <h2 class="-mt-16 text-center text-5xl font-bold text-white md:text-6xl">instruo.org</h2>
      <p class="mt-6 max-w-xl text-center text-lg font-light text-white md:text-2xl">
        Simple tools to make your life easier and more productive.
      </p>
      <div class="mt-6 flex flex-col items-center gap-4 sm:flex-row">
        <NuxtLink :to="'/tools'">
          <UiButton variant="default"> All Tools </UiButton>
        </NuxtLink>
        <NuxtLink
          href="https://rahulv.dev"
          target="_blank"
        >
          <UiButton variant="secondary"> Contact </UiButton>
        </NuxtLink>
      </div>
    </Vortex>
  </div>
</template>
