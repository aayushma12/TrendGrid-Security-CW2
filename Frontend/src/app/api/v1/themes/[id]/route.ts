import { prisma } from "@/lib/db";
import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { sanitizeTokens, toJsonSafe } from "@/lib/theme-write";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/themes/:id — full theme with all tokens (tenant-scoped). */
export async function GET(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { id } = await params;

  const theme = await prisma.theme.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
  });
  if (!theme) return Response.json({ error: "Theme not found" }, { status: 404 });
  return Response.json({ data: theme });
}

/**
 * PATCH /api/v1/themes/:id — token update + version history snapshot.
 *
 * Body flags:
 * - `draft: true`        → store tokens in `draftTokens` only; the live theme
 *                          (what shoppers see) is untouched until publish.
 * - `discardDraft: true` → clear `draftTokens` and return the live theme.
 * - neither              → legacy direct write to the live columns.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { id } = await params;

  const existing = await prisma.theme.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
  });
  if (!existing) return Response.json({ error: "Theme not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  if (body.discardDraft === true) {
    const updated = await prisma.theme.update({
      where: { id: existing.id },
      data: { draftTokens: null },
    });
    return Response.json({ data: updated });
  }

  const tokens = sanitizeTokens(body);

  if (body.draft === true) {
    const data: Record<string, unknown> = { draftTokens: tokens };
    if (typeof body.name === "string") data.name = body.name;
    const updated = await prisma.theme.update({ where: { id: existing.id }, data });
    return Response.json({ data: updated });
  }

  const data = tokens;
  if (typeof body.name === "string") (data as Record<string, unknown>).name = body.name;

  await prisma.themeHistory.create({
    data: {
      themeId: existing.id,
      tenantId: tenant.id,
      snapshot: toJsonSafe(existing),
      label: "auto-save",
    },
  });
  const old = await prisma.themeHistory.findMany({
    where: { themeId: existing.id },
    orderBy: { savedAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (old.length) {
    await prisma.themeHistory.deleteMany({ where: { id: { in: old.map((o: (typeof old)[number]) => o.id) } } });
  }

  const updated = await prisma.theme.update({ where: { id: existing.id }, data });
  return Response.json({ data: updated });
}

/** DELETE /api/v1/themes/:id — soft delete. */
export async function DELETE(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { id } = await params;

  const existing = await prisma.theme.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
  });
  if (!existing) return Response.json({ error: "Theme not found" }, { status: 404 });
  if (existing.isActive) {
    return Response.json({ error: "Cannot delete the active theme" }, { status: 409 });
  }

  await prisma.theme.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  return new Response(null, { status: 204 });
}
