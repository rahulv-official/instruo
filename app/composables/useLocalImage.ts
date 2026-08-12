export function useLocalImage() {
  const file = shallowRef<File | null>(null);
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
  async function select(event: Event) {
    const next = (event.target as HTMLInputElement).files?.[0];
    if (!next) return;
    release(sourceUrl.value);
    release(outputUrl.value);
    file.value = next;
    sourceUrl.value = URL.createObjectURL(next);
    outputUrl.value = "";
    const image = await load(sourceUrl.value);
    width.value = image.naturalWidth;
    height.value = image.naturalHeight;
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
  return { file, sourceUrl, outputUrl, width, height, select, render, download };
}
