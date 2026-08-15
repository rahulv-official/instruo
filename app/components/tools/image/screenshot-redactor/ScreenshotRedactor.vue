<script setup lang="ts">
type RedactionMode = "redact" | "blur" | "pixelate" | "highlight";
interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  mode: RedactionMode;
}
type Interaction = "draw" | "move" | null;

const canvas = ref<HTMLCanvasElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const sourceUrl = ref("");
const mode = ref<RedactionMode>("redact");
const regions = ref<Region[]>([]);
const drawing = ref(false);
const start = ref({ x: 0, y: 0 });
const interaction = ref<Interaction>(null);
const draft = ref<Region | null>(null);
const originalRegion = ref<Region | null>(null);
const selectedRegionIndex = ref<number | null>(null);
const status = ref("Choose an image, then drag over sensitive areas.");
const modes = [
  { label: "Redact", value: "redact" },
  { label: "Blur", value: "blur" },
  { label: "Pixelate", value: "pixelate" },
  { label: "Highlight", value: "highlight" },
];

const selectedRegion = computed(() =>
  selectedRegionIndex.value === null ? null : (regions.value[selectedRegionIndex.value] ?? null),
);
const activeMode = computed<RedactionMode>({
  get: () => selectedRegion.value?.mode ?? mode.value,
  set: (value) => {
    mode.value = value;
    if (selectedRegion.value) {
      selectedRegion.value.mode = value;
      status.value = "Effect updated. Drag the selected area to move it.";
      draw();
    }
  },
});

function point(event: PointerEvent) {
  const element = canvas.value!;
  const rect = element.getBoundingClientRect();
  return {
    x: Math.max(
      0,
      Math.min(element.width, (event.clientX - rect.left) * (element.width / rect.width)),
    ),
    y: Math.max(
      0,
      Math.min(element.height, (event.clientY - rect.top) * (element.height / rect.height)),
    ),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function regionFromPoints(first: { x: number; y: number }, last: { x: number; y: number }) {
  return {
    x: Math.min(first.x, last.x),
    y: Math.min(first.y, last.y),
    width: Math.abs(last.x - first.x),
    height: Math.abs(last.y - first.y),
    mode: mode.value,
  } satisfies Region;
}

function drawGuide(context: CanvasRenderingContext2D, region: Region) {
  const handleSize = Math.max(8, Math.min(14, context.canvas.width / 90));
  const handles: Array<[number, number]> = [
    [region.x, region.y],
    [region.x + region.width, region.y],
    [region.x, region.y + region.height],
    [region.x + region.width, region.y + region.height],
  ];

  context.save();
  context.fillStyle = "rgb(255 255 255 / 0.05)";
  context.fillRect(region.x, region.y, region.width, region.height);
  context.strokeStyle = "#fb923c";
  context.lineWidth = Math.max(2, context.canvas.width / 700);
  context.setLineDash([8, 5]);
  context.strokeRect(region.x, region.y, region.width, region.height);
  context.setLineDash([]);
  context.fillStyle = "#fff7ed";
  context.strokeStyle = "#ea580c";
  for (const [x, y] of handles) {
    context.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    context.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  }
  context.restore();
}

function applyRegion(context: CanvasRenderingContext2D, source: HTMLImageElement, region: Region) {
  context.save();
  if (region.mode === "redact") {
    context.fillStyle = "#111214";
    context.fillRect(region.x, region.y, region.width, region.height);
  }
  if (region.mode === "highlight") {
    context.fillStyle = "rgb(250 204 21 / 0.45)";
    context.fillRect(region.x, region.y, region.width, region.height);
  }
  if (region.mode === "blur") {
    context.filter = "blur(14px)";
    context.drawImage(
      source,
      region.x,
      region.y,
      region.width,
      region.height,
      region.x,
      region.y,
      region.width,
      region.height,
    );
  }
  if (region.mode === "pixelate") {
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.ceil(region.width / 12));
    small.height = Math.max(1, Math.ceil(region.height / 12));
    const smallContext = small.getContext("2d");
    if (smallContext) {
      smallContext.imageSmoothingEnabled = false;
      smallContext.drawImage(
        source,
        region.x,
        region.y,
        region.width,
        region.height,
        0,
        0,
        small.width,
        small.height,
      );
      context.imageSmoothingEnabled = false;
      context.drawImage(
        small,
        0,
        0,
        small.width,
        small.height,
        region.x,
        region.y,
        region.width,
        region.height,
      );
    }
  }
  context.restore();
}

function draw() {
  const element = canvas.value;
  const source = image.value;
  if (!element || !source) return;
  const context = element.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, element.width, element.height);
  context.drawImage(source, 0, 0, element.width, element.height);
  for (const region of regions.value) {
    applyRegion(context, source, region);
  }
  if (draft.value) {
    applyRegion(context, source, draft.value);
    drawGuide(context, draft.value);
  } else if (selectedRegion.value) {
    drawGuide(context, selectedRegion.value);
  }
}

function findRegion(position: { x: number; y: number }) {
  for (let index = regions.value.length - 1; index >= 0; index -= 1) {
    const region = regions.value[index];
    if (!region) continue;
    if (
      position.x >= region.x &&
      position.x <= region.x + region.width &&
      position.y >= region.y &&
      position.y <= region.y + region.height
    ) {
      return index;
    }
  }
  return -1;
}

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    status.value = "Choose an image file.";
    return;
  }
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
  sourceUrl.value = URL.createObjectURL(file);
  const next = new Image();
  next.onload = () => {
    image.value = next;
    const max = 1400;
    const scale = Math.min(1, max / Math.max(next.naturalWidth, next.naturalHeight));
    if (canvas.value) {
      canvas.value.width = Math.round(next.naturalWidth * scale);
      canvas.value.height = Math.round(next.naturalHeight * scale);
    }
    regions.value = [];
    selectedRegionIndex.value = null;
    draft.value = null;
    draw();
    status.value = "Drag across the image to preview a redaction area.";
  };
  next.src = sourceUrl.value;
}
function startDrawing(event: PointerEvent) {
  if (!image.value) return;
  const element = canvas.value;
  if (!element) return;
  const position = point(event);
  const hit = findRegion(position);
  selectedRegionIndex.value = hit === -1 ? null : hit;
  drawing.value = true;
  start.value = position;
  element.focus();
  element.setPointerCapture(event.pointerId);
  if (hit === -1) {
    interaction.value = "draw";
    draft.value = regionFromPoints(position, position);
    status.value = "Keep dragging to size the area. Release to apply it.";
  } else {
    const region = regions.value[hit];
    if (!region) return;
    interaction.value = "move";
    originalRegion.value = { ...region };
    status.value = "Selected area. Drag to move it, or change its effect above.";
  }
  draw();
}

function moveDrawing(event: PointerEvent) {
  if (!drawing.value || !canvas.value) return;
  const position = point(event);
  if (interaction.value === "draw") {
    draft.value = regionFromPoints(start.value, position);
  }
  if (interaction.value === "move" && originalRegion.value && selectedRegionIndex.value !== null) {
    const original = originalRegion.value;
    const next = {
      ...original,
      x: clamp(original.x + position.x - start.value.x, 0, canvas.value.width - original.width),
      y: clamp(original.y + position.y - start.value.y, 0, canvas.value.height - original.height),
    };
    regions.value[selectedRegionIndex.value] = next;
  }
  draw();
}

function endDrawing(event?: PointerEvent) {
  if (!drawing.value) return;
  drawing.value = false;
  if (event && canvas.value?.hasPointerCapture(event.pointerId)) {
    canvas.value.releasePointerCapture(event.pointerId);
  }
  if (interaction.value === "draw" && draft.value) {
    const region = draft.value;
    draft.value = null;
    if (region.width > 8 && region.height > 8) {
      regions.value.push(region);
      selectedRegionIndex.value = regions.value.length - 1;
      status.value = "Area added. Drag it to move, or change its effect above.";
    } else {
      status.value = "Drag a larger area to create a redaction.";
    }
  } else if (interaction.value === "move") {
    status.value = "Area moved. Change its effect above or drag it again.";
  }
  interaction.value = null;
  originalRegion.value = null;
  draw();
}

function deleteSelected() {
  if (selectedRegionIndex.value === null) return;
  regions.value.splice(selectedRegionIndex.value, 1);
  selectedRegionIndex.value = null;
  status.value = "Selected area removed.";
  draw();
}

function onCanvasKeydown(event: KeyboardEvent) {
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
  }
  if (event.key === "Escape") {
    selectedRegionIndex.value = null;
    status.value = "Selection cleared. Drag on the image to add another area.";
    draw();
  }
}

function clearRegions() {
  regions.value = [];
  selectedRegionIndex.value = null;
  draft.value = null;
  status.value = "All redactions cleared. Drag on the image to add one.";
  draw();
}
function download() {
  canvas.value?.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "redacted-image.png";
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
}
</script>

<template>
  <ToolWorkbench description="Redact screenshots locally before sharing them. Nothing is uploaded.">
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
        <UFormField label="Image"
          ><input
            type="file"
            accept="image/*"
            class="border-muted bg-muted/20 text-default file:bg-elevated file:text-default w-full rounded-md border p-2 px-3 text-sm file:mr-3 file:rounded file:border-0 file:px-3 file:py-1.5"
            @change="onFile"
        /></UFormField>
        <UFormField :label="selectedRegion ? 'Selected effect' : 'Effect for new areas'"
          ><USelect
            v-model="activeMode"
            :items="modes"
            value-key="value"
            class="w-full"
        /></UFormField>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-muted text-sm">
          <template v-if="selectedRegion">
            Selected area: drag to move it, use the effect menu to change it, or press Delete.
          </template>
          <template v-else-if="image">
            Drag on the image to preview a redaction area. Click an existing area to edit it.
          </template>
        </p>
        <div class="flex items-center gap-2">
          <UBadge
            v-if="regions.length"
            color="neutral"
            variant="soft"
          >
            {{ regions.length }} {{ regions.length === 1 ? "area" : "areas" }}
          </UBadge>
          <UButton
            v-if="selectedRegion"
            label="Delete selected"
            icon="i-tabler-trash"
            color="neutral"
            variant="outline"
            size="sm"
            @click="deleteSelected"
          />
        </div>
      </div>
      <div class="border-muted bg-muted/20 overflow-auto rounded-md border p-3">
        <canvas
          ref="canvas"
          class="focus-visible:ring-primary/50 mx-auto block max-h-[65vh] max-w-full touch-none outline-none focus-visible:ring-2"
          :class="image ? 'cursor-crosshair' : 'cursor-default'"
          role="application"
          aria-label="Screenshot redaction canvas. Drag to create or move redaction areas."
          tabindex="0"
          @pointerdown="startDrawing"
          @pointermove="moveDrawing"
          @pointerup="endDrawing"
          @pointercancel="endDrawing"
          @keydown="onCanvasKeydown"
        />
        <p
          v-if="!image"
          class="text-muted py-16 text-center text-sm"
        >
          Image preview appears here.
        </p>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          label="Clear redactions"
          icon="i-tabler-eraser"
          color="neutral"
          variant="outline"
          :disabled="!regions.length"
          @click="clearRegions"
        /><UButton
          label="Download PNG"
          icon="i-tabler-download"
          :disabled="!image"
          @click="download"
        />
      </div>
      <p
        class="text-muted text-sm"
        role="status"
      >
        {{ status }}
      </p>
    </div>
  </ToolWorkbench>
</template>
