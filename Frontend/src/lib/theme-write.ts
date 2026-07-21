/**
 * Helpers for safely writing theme token updates from API requests.
 * Kept out of route files because Next.js App Router only permits HTTP-method
 * exports from a `route.ts`.
 */

/** Strip protected / non-token fields from an incoming partial theme body. */
export function sanitizeTokens(body: Record<string, unknown>) {
  const blocked = new Set([
    "id",
    "tenantId",
    "tenant",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "isActive",
    "isDefault",
    "version",
    "history",
    "name",
    "publishedAt",
    "createdBy",
    "lastEditedBy",
    "draftTokens",
    "draft",
    "discardDraft",
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!blocked.has(k)) out[k] = v;
  }
  return out;
}

/** Convert any record into a JSON-safe plain object (Dates -> ISO strings). */
export function toJsonSafe(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}
