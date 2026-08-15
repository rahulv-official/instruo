<script setup lang="ts">
interface FooterLink {
  label: string;
  target?: string;
  to: string;
}

const { footer } = useAppConfig();

function isExternal(link: FooterLink) {
  return link.target === "_blank";
}
</script>

<template>
  <UFooter
    class="instruo-home border-muted bg-muted/55 mt-0 border-t transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    :ui="{
      top: 'border-muted border-b py-0',
      container: 'py-5 lg:py-5',
      center: 'text-dimmed text-sm',
    }"
  >
    <template #top>
      <UContainer class="grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-14">
        <div class="lg:col-span-5">
          <NuxtLink
            to="/"
            class="text-highlighted focus-visible:outline-primary inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Instruo home"
          >
            <img
              src="/logo.svg"
              alt=""
              width="28"
              height="28"
              class="size-7 shrink-0"
            />
            <span class="text-base font-semibold tracking-tight">Instruo</span>
          </NuxtLink>

          <p class="text-muted mt-5 max-w-sm text-sm leading-6">
            {{ footer.description }}
          </p>
          <p class="text-toned mt-5 flex items-center gap-2 text-sm">
            <UIcon
              name="i-tabler-lock"
              class="size-4"
              aria-hidden="true"
            />
            No account required.
          </p>
        </div>

        <nav
          aria-label="Footer"
          class="grid gap-8 sm:grid-cols-2 lg:col-span-7 xl:grid-cols-3"
        >
          <div
            v-for="column in footer.columns"
            :key="column.label"
          >
            <h2 class="text-highlighted text-sm font-semibold">
              {{ column.label }}
            </h2>

            <ul class="mt-4 grid gap-1">
              <li
                v-for="link in column.children"
                :key="link.label"
              >
                <ULink
                  :to="link.to"
                  :target="link.target"
                  :rel="isExternal(link) ? 'noopener noreferrer' : undefined"
                  class="group text-muted hover:bg-elevated hover:text-highlighted focus-visible:outline-primary flex min-h-10 items-center justify-between gap-3 rounded-md px-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span>{{ link.label }}</span>
                  <UIcon
                    :name="isExternal(link) ? 'i-tabler-arrow-up-right' : 'i-tabler-arrow-right'"
                    class="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                    :class="{ 'group-hover:-translate-y-0.5': isExternal(link) }"
                    aria-hidden="true"
                  />
                </ULink>
              </li>
            </ul>
          </div>
        </nav>
      </UContainer>
    </template>

    <template #left>
      {{ footer.credits }}
    </template>

    {{ footer.tagline }}

    <template #right>
      <UColorModeButton v-if="footer.colorMode" />
      <UButton
        v-for="(link, index) in footer.links"
        :key="index"
        v-bind="link"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
