import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { getPage } from "@/lib/store-data";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * GET /api/v1/pages/:slug — public page layout (ordered sections + blocks) for
 * the resolved tenant. Used by the storefront renderer.
 */
export async function GET(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { slug } = await params;

  const sections = await getPage(tenant.id, slug);
  return Response.json(
    { data: { slug, sections } },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
