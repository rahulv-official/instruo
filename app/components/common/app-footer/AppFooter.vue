<script setup lang="ts">
interface FooterLink {
  label: string;
  target?: string;
  to: string;
}

const { footer } = useAppConfig();

function getLinkTarget(link: FooterLink) {
  return link.target;
}

function isExternal(link: FooterLink) {
  return link.target === "_blank";
}
</script>

<template>
  <UFooter
    class="bg-default mt-20"
    :ui="{
      top: 'border-default/70 border-y py-0',
      container: 'py-6 lg:py-6',
      center: 'text-dimmed text-sm',
    }"
  >
    <template #top>
      <UContainer class="grid gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-16">
        <div class="lg:col-span-5">
          <NuxtLink
            to="/"
            class="text-highlighted inline-flex items-center gap-3"
            aria-label="Instruo home"
          >
            <img
              src="/logo.svg"
              alt=""
              width="32"
              height="32"
              class="size-8 shrink-0"
            />
            <span class="text-base font-semibold tracking-tight">Instruo</span>
          </NuxtLink>

          <p class="text-muted mt-6 max-w-sm text-sm leading-6">
            {{ footer.description }}
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

            <ul class="border-default/70 mt-5 border-t">
              <li
                v-for="link in column.children"
                :key="link.label"
                class="border-default/70 border-b"
              >
                <ULink
                  :to="link.to"
                  :target="getLinkTarget(link)"
                  :rel="isExternal(link) ? 'noopener noreferrer' : undefined"
                  class="group text-muted hover:text-highlighted focus-visible:outline-primary flex min-h-11 items-center justify-between gap-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span>{{ link.label }}</span>
                  <UIcon
                    :name="isExternal(link) ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'"
                    class="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
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
