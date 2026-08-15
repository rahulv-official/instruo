export function useLocalImage() {
  const maxBytes = 25 * 1024 * 1024;
  const maxPixels = 40_000_000;
  const file = shallowRef<File | null>(null);
  const error = ref("");
  const sourceUrl = ref("");
  const outputUrl = ref("");
  const width = ref(0);
  const height = ref(0);

  function release(url: string) {
    if (url) URL.revokeObjectURL(url);
  }
  function load(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image could not be decoded."));
      image.src = url;
    });
  }
  async function select(input: Event | File | null | undefined) {
    const next = input instanceof File ? input : (input?.target as HTMLInputElement)?.files?.[0];
    if (!next) {
      release(sourceUrl.value);
      release(outputUrl.value);
      file.value = null;
      sourceUrl.value = "";
      outputUrl.value = "";
      width.value = 0;
      height.value = 0;
      error.value = "";
      return;
    }
    error.value = "";
    if (!next.type.startsWith("image/")) {
      error.value = "Choose an image file.";
      return;
    }
    if (next.size > maxBytes) {
      error.value = "That image is larger than 25 MB. Choose a smaller file.";
      return;
    }
    release(sourceUrl.value);
    release(outputUrl.value);
    file.value = next;
    sourceUrl.value = URL.createObjectURL(next);
    outputUrl.value = "";
    try {
      const image = await load(sourceUrl.value);
      if (image.naturalWidth * image.naturalHeight > maxPixels) {
        release(sourceUrl.value);
        sourceUrl.value = "";
        file.value = null;
        error.value = "That image has more than 40 megapixels. Choose a smaller image.";
        return;
      }
      width.value = image.naturalWidth;
      height.value = image.naturalHeight;
    } catch (cause) {
      release(sourceUrl.value);
      sourceUrl.value = "";
      file.value = null;
      error.value = cause instanceof Error ? cause.message : "Image could not be decoded.";
    }
  }
  async function render(options: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    crop?: boolean;
    mime?: string;
    quality?: number;
  }) {
    if (!sourceUrl.value) return;
    const image = await load(sourceUrl.value);
    const canvas = document.createElement("canvas");
    canvas.width = options.width ?? image.naturalWidth;
    canvas.height = options.height ?? image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (options.mime === "image/jpeg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (options.crop) {
      context.drawImage(
        image,
        options.x ?? 0,
        options.y ?? 0,
        options.width ?? image.naturalWidth,
        options.height ?? image.naturalHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    } else {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, options.mime ?? "image/png", options.quality),
    );
    if (!blob) return;
    release(outputUrl.value);
    outputUrl.value = URL.createObjectURL(blob);
    return blob;
  }
  function download(filename: string) {
    if (!outputUrl.value) return;
    const link = document.createElement("a");
    link.href = outputUrl.value;
    link.download = filename;
    link.click();
  }
  onBeforeUnmount(() => {
    release(sourceUrl.value);
    release(outputUrl.value);
  });
  return { file, sourceUrl, outputUrl, width, height, error, select, render, download };
}
