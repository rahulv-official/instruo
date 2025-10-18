<script lang="ts" setup>
import { shaders } from "~/constants/shaders";
</script>

<template>
  <div
    class="min-h-screen flex flex-col w-full items-center justify-center gap-4 relative p-8 max-lg:p-6"
  >
    <ShaderToy
      class="absolute inset-0 z-[-1] opacity-25"
      :shader-code="shaders.liquidWarp"
      :brightness="0.5"
      :speed="0.2"
    />
    <div
      class="max-w-4xl flex flex-col items-center justify-center py-24 gap-6"
    >
      <h1
        class="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-500 bg-clip-text text-7xl max-md:text-5xl leading-none text-transparent dark:from-white dark:to-gray-50/40 text-pretty text-center font-bold tracking-tight -mt-36"
      >
        Your Everyday Toolkit for the Web
      </h1>
      <span class="text-2xl max-lg:text-xl text-center text-muted font-normal">
        Do more with less — instant utilities for text, data, and everyday
        tasks.
      </span>

      <div class="flex items-center justify-center gap-4 mt-8">
        <NuxtLink to="/tools">
          <UButton
            :size="'xl'"
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
