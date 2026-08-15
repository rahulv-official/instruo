<script setup lang="ts">
interface Finding {
  severity: "error" | "warning" | "info";
  title: string;
  detail: string;
}
const html = ref(
  `<html>\n  <main>\n    <h1>Welcome</h1>\n    <img src="hero.jpg">\n    <button>Continue</button>\n  </main>\n</html>`,
);
const findings = computed<Finding[]>(() => {
  const result: Finding[] = [];
  const htmlTag = html.value.match(/<html\b[^>]*>/i)?.[0] ?? "";
  if (!/\blang\s*=/.test(htmlTag))
    result.push({
      severity: "error",
      title: "Document language missing",
      detail: "Add lang to the html element.",
    });
  const images = [...html.value.matchAll(/<img\b([^>]*)>/gi)];
  if (images.some((match) => !/\balt\s*=/.test(match[1] ?? "")))
    result.push({
      severity: "error",
      title: "Image alternative text missing",
      detail: "Every meaningful image needs an alt attribute.",
    });
  const buttons = [...html.value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  if (buttons.some((match) => !match[1]?.includes("aria-label") && !match[2]?.trim()))
    result.push({
      severity: "error",
      title: "Unnamed button",
      detail: "Give empty buttons an accessible name.",
    });
  const inputs = [...html.value.matchAll(/<input\b([^>]*)>/gi)];
  if (inputs.some((match) => !/\baria-label\s*=|\bid\s*=/.test(match[1] ?? "")))
    result.push({
      severity: "warning",
      title: "Form control may be unlabeled",
      detail: "Pair controls with a label or aria-label.",
    });
  if (!/<main\b/i.test(html.value) && !/<nav\b/i.test(html.value))
    result.push({
      severity: "warning",
      title: "Landmark structure missing",
      detail: "Use main, nav, header, or footer landmarks.",
    });
  if (!result.length)
    result.push({
      severity: "info",
      title: "No common issues found",
      detail:
        "This lightweight checker is a first pass, not a replacement for axe or manual testing.",
    });
  return result;
});
const errors = computed(() => findings.value.filter((item) => item.severity === "error").length);
const warnings = computed(
  () => findings.value.filter((item) => item.severity === "warning").length,
);
</script>

<template>
  <ToolWorkbench
    description="Run a quick, privacy-safe accessibility pass over pasted HTML before deeper testing."
  >
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <UFormField label="HTML source">
        <UTextarea
          v-model="html"
          :rows="20"
          class="w-full font-mono"
        />
      </UFormField>
      <div class="grid content-start gap-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-muted/30 rounded-md p-4">
            <p class="text-muted text-xs">Errors</p>
            <p class="text-error mt-1 text-2xl font-semibold">{{ errors }}</p>
          </div>
          <div class="bg-muted/30 rounded-md p-4">
            <p class="text-muted text-xs">Warnings</p>
            <p class="text-warning mt-1 text-2xl font-semibold">{{ warnings }}</p>
          </div>
        </div>
        <ul
          class="grid gap-3"
          aria-live="polite"
        >
          <li
            v-for="finding in findings"
            :key="finding.title"
            class="border-muted bg-muted/20 rounded-md border p-4"
          >
            <div class="flex items-start gap-3">
              <UIcon
                :name="
                  finding.severity === 'error'
                    ? 'i-tabler-alert-circle'
                    : finding.severity === 'warning'
                      ? 'i-tabler-alert-triangle'
                      : 'i-tabler-check'
                "
                :class="
                  finding.severity === 'error'
                    ? 'text-error'
                    : finding.severity === 'warning'
                      ? 'text-warning'
                      : 'text-success'
                "
                class="mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p class="font-medium">{{ finding.title }}</p>
                <p class="text-muted mt-1 text-sm">{{ finding.detail }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </ToolWorkbench>
</template>
