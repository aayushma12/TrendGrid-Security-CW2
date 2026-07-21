import type { HomeSectionContent } from "@/lib/api/types";

/** Reads a single field's value by key, falling back to the hardcoded default. */
export function fieldValue(
  content: HomeSectionContent | null,
  key: string,
  fallback: string,
): string {
  const f = content?.fields.find((field) => field.key === key);
  return f?.value ? f.value : fallback;
}

/** Reads a repeater's items by key, falling back to the hardcoded default list. */
export function repeaterItems(
  content: HomeSectionContent | null,
  key: string,
  fallback: Record<string, string>[],
): Record<string, string>[] {
  const r = content?.repeaters.find((rep) => rep.key === key);
  return r && r.items.length > 0 ? r.items : fallback;
}
