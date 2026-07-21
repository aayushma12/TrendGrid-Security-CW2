import { prisma } from "@/lib/db";
import { resolveTenant, tenantNotFound } from "@/lib/tenant";

const PAGE_TYPES = ["home", "shop", "about", "landing", "custom"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60) || "page";
}

/** GET /api/v1/admin/pages — all pages for the tenant. */
export async function GET(req: Request) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();

  const pages = await prisma.page.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { sections: true } } },
  });
  return Response.json({ data: pages });
}

/** POST /api/v1/admin/pages — create a page. Body: { title, slug?, type? } */
export async function POST(req: Request) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });

  const type: string = PAGE_TYPES.includes(body.type) ? body.type : "custom";

  // Unique slug per tenant: base, base-2, base-3, ...
  const base = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.page.findFirst({ where: { tenantId: tenant.id, slug }, select: { id: true } });
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const page = await prisma.page.create({
    data: { tenantId: tenant.id, title, slug, type, status: "draft" },
  });
  return Response.json({ data: page }, { status: 201 });
}
