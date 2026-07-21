import { prisma } from "@/lib/db";
import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { SECTION_CATALOG } from "@/components/storefront/sections";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/v1/admin/pages/:id/sections — append a section. Body: { type } */
export async function POST(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { id } = await params;

  const page = await prisma.page.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
    select: { id: true },
  });
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const entry = SECTION_CATALOG.find((s) => s.type === body.type);
  if (!entry) return Response.json({ error: "Unknown section type" }, { status: 400 });

  const last = (await prisma.section.findFirst({
    where: { pageId: page.id, deletedAt: null },
    orderBy: { order: "desc" },
  })) as { order: number } | null;

  const section = await prisma.section.create({
    data: {
      tenantId: tenant.id,
      pageId: page.id,
      type: entry.type,
      order: (last?.order ?? -1) + 1,
      isVisible: true,
      settingsJson: { heading: entry.label },
    },
  });
  return Response.json({ data: section }, { status: 201 });
}

/** PATCH /api/v1/admin/pages/:id/sections — reorder. Body: { sectionIds: string[] } */
export async function PATCH(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { id } = await params;

  const page = await prisma.page.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
    select: { id: true },
  });
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.sectionIds) ? body.sectionIds.filter((x: unknown) => typeof x === "string") : [];
  if (!ids.length) return Response.json({ error: "sectionIds is required" }, { status: 400 });

  await prisma.$transaction(
    ids.map((sectionId, index) =>
      prisma.section.updateMany({
        where: { id: sectionId, pageId: page.id, tenantId: tenant.id },
        data: { order: index },
      }),
    ),
  );
  return Response.json({ data: { ok: true } });
}
