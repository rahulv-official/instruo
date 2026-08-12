export async function copyBrowserText(value: string) {
  if (!value || !import.meta.client || !navigator.clipboard) return false;
  await navigator.clipboard.writeText(value);
  return true;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(url: string, filename: string) {
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

export function formatMarkup(value: string, minify = false) {
  if (minify)
    return value
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .trim();
  let depth = 0;
  return value
    .replace(/>\s+</g, "><")
    .replace(/(>)(<)(\/?)/g, "$1\n$2$3")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
      const output = `${"  ".repeat(depth)}${line.trim()}`;
      if (/^<[^!/][^>]*[^/]>/.test(line) && !/<\/(?:div|p|section|main|body|html)>/.test(line))
        depth += 1;
      return output;
    })
    .join("\n");
}

export function formatScript(value: string, minify = false) {
  if (minify)
    return value
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  return value
    .replace(/\s*\{\s*/g, " {\n")
    .replace(/\s*\}\s*/g, "\n}\n")
    .replace(/;\s*/g, ";\n")
    .trim();
}

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function jsonToYaml(value: JsonValue, depth = 0): string {
  const pad = "  ".repeat(depth);
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object"
          ? `${pad}-\n${jsonToYaml(item, depth + 1)}`
          : `${pad}- ${yamlScalar(item)}`,
      )
      .join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) =>
        item && typeof item === "object"
          ? `${pad}${key}:\n${jsonToYaml(item, depth + 1)}`
          : `${pad}${key}: ${yamlScalar(item)}`,
      )
      .join("\n");
  }
  return `${pad}${yamlScalar(value)}`;
}

function yamlScalar(value: JsonValue) {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string")
    return /[:#{}&,*!|>'"%@`]/.test(value) || !value ? JSON.stringify(value) : value;
  return JSON.stringify(value);
}

export function hexRgb(value: string) {
  const match = value.replace("#", "").match(/^[\da-f]{6}$/i);
  return match
    ? [0, 2, 4].map((index) => Number.parseInt(match[0]!.slice(index, index + 2), 16))
    : null;
}

export function relativeLuminance(value: string) {
  const rgb = hexRgb(value);
  if (!rgb) return 0;
  return rgb.reduce((sum, channel, index) => {
    const normalized = channel / 255;
    const linear =
      normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
  }, 0);
}
