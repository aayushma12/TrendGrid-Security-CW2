import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { getActiveThemeTokens } from "@/lib/store-data";
import { themeToCssVars } from "@/lib/design-tokens";

/**
 * GET /api/v1/themes/active/tokens — the active theme as both the raw token
 * object and a ready-to-apply CSS-variable map. Used by the storefront and the
 * admin live preview.
 */
export async function GET(req: Request) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();

  const tokens = await getActiveThemeTokens(tenant.id);
  return Response.json(
    { data: { tokens, cssVars: themeToCssVars(tokens) } },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
