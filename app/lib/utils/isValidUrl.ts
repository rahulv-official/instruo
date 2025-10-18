export function isValidURL(str: string): boolean {
  try {
    return URL.canParse(str);
  } catch {
    return false;
  }
}
