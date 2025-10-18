export function isValidBase64(str: string): boolean {
  if (typeof str !== "string") return false;

  const trimmed = str.trim();

  // Base64 string length must be a multiple of 4
  if (trimmed.length === 0 || trimmed.length % 4 !== 0) {
    return false;
  }

  // Valid Base64 regex:
  // - Must only contain A-Z, a-z, 0-9, +, /
  // - May end with = or == (padding)
  // - No other characters allowed
  const base64Regex = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;

  return base64Regex.test(trimmed);
}
