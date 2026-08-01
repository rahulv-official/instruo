<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const root = useTemplateRef<HTMLElement>("root");
let context: ReturnType<typeof gsap.context> | undefined;
let media: ReturnType<typeof gsap.matchMedia> | undefined;

onMounted(() => {
  if (!root.value) return;

  gsap.registerPlugin(ScrollTrigger);
  context = gsap.context(() => {
    media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".hero-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.75,
        stagger: 0.08,
        ease: "power3.out",
      });

      gsap.utils.toArray<HTMLElement>(".home-reveal").forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "clamp(top 88%)",
            once: true,
          },
        });
      });
    });
  }, root.value);
});

onUnmounted(() => {
  media?.revert();
  context?.revert();
});
</script>

<template>
  <div
    ref="root"
    class="w-full max-w-full overflow-x-hidden"
  >
    <slot />
  </div>
</template>
