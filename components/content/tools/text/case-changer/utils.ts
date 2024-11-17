export type CaseType = "lower" | "upper" | "sentence" | "capitalized";

export function getConvertedText(text: string, toCase: CaseType) {
  switch (toCase) {
    case "lower":
      return text.toLowerCase();
    case "upper":
      return text.toUpperCase();
    case "sentence":
      return toSentenceCase(text);
    case "capitalized":
      return toCapitalCase(text);
  }
}

function toSentenceCase(str: string) {
  if (str.length === 0) return str;

  // Trim leading and trailing spaces, then convert first character to uppercase and the rest to lowercase
  return str.trim().charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toCapitalCase(text: string) {
  return text.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
