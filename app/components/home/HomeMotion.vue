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
        y: 20,
        duration: 0.68,
        stagger: 0.075,
        ease: "power4.out",
      });

      gsap.utils.toArray<HTMLElement>(".home-reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 24 },
          {
            y: 0,
            duration: 0.72,
            ease: "power4.out",
            scrollTrigger: {
              trigger: element,
              start: "clamp(top 88%)",
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".game-feature").forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 18 },
          {
            y: 0,
            duration: 0.58,
            delay: index * 0.06,
            ease: "power4.out",
            scrollTrigger: {
              trigger: element,
              start: "clamp(top 92%)",
              once: true,
            },
          },
        );
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
