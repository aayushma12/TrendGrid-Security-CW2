import { prisma } from "@/lib/db";
import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { getActiveThemeTokens } from "@/lib/store-data";
import { themeToCssVars } from "@/lib/design-tokens";

/**
 * GET /api/v1/store/config — store settings + active theme tokens. The single
 * call the storefront shell needs to bootstrap a tenant's branding.
 */
export async function GET(req: Request) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();

  const [settings, tokens] = await Promise.all([
    prisma.storeSettings.findFirst({ where: { tenantId: tenant.id } }),
    getActiveThemeTokens(tenant.id),
  ]);

  return Response.json(
    {
      data: {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        settings,
        theme: { tokens, cssVars: themeToCssVars(tokens) },
      },
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
