/**
 * Title Case for Admin UI labels/status display.
 * Does not change underlying Airtable/API values.
 */
export function toTitleCaseLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      // Keep simple tokens like "1" as-is; title-case the rest.
      if (/^\d+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
