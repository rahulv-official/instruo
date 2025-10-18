<script lang="ts" setup>
import { shaders } from "~/constants/shaders";
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col items-center justify-center gap-4 p-8 max-lg:p-6"
  >
    <ShaderToy
      class="absolute inset-0 z-[-1] opacity-25"
      :shader-code="shaders.liquidWarp"
      :brightness="0.5"
      :speed="0.2"
    />
    <div class="flex max-w-4xl flex-col items-center justify-center gap-6 py-24">
      <h1
        class="pointer-events-none -mt-36 bg-gradient-to-b from-black to-gray-500 bg-clip-text text-center text-7xl leading-none font-bold tracking-tight text-pretty whitespace-pre-wrap text-transparent max-md:text-5xl dark:from-white dark:to-gray-50/40"
      >
        Your Everyday Toolkit for the Web
      </h1>
      <span class="text-muted text-center text-2xl font-normal max-lg:text-xl">
        Do more with less — instant utilities for text, data, and everyday tasks.
      </span>

      <div class="mt-8 flex items-center justify-center gap-4">
        <NuxtLink to="/tools">
          <UButton
            size="xl"
            variant="solid"
            label="Explore Tools"
            trailing-icon="tabler:arrow-right"
          />
        </NuxtLink>
        <UButton
          size="xl"
          variant="outline"
          label="Star on Github"
          leading-icon="tabler:star-filled"
        />
      </div>
    </div>
  </div>
</template>
