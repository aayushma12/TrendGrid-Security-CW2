import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { sanitizeTokens, toJsonSafe } from "@/lib/theme-write";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/themes/:id/publish — make this theme the single active theme for
 * the tenant. If the theme has unpublished `draftTokens`, they are applied to
 * the live columns here (and cleared), so this is the only moment shoppers see
 * the changes. Deactivates all other themes atomically and bumps the version.
 */
export async function POST(req: Request, { params }: Ctx) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();
  const { id } = await params;

  const theme = await prisma.theme.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
  });
  if (!theme) return Response.json({ error: "Theme not found" }, { status: 404 });

  // Pending draft tokens get applied to the live columns at publish time.
  const draft =
    theme.draftTokens && typeof theme.draftTokens === "object" && !Array.isArray(theme.draftTokens)
      ? sanitizeTokens(theme.draftTokens as Record<string, unknown>)
      : null;

  const ops = [];

  if (draft && Object.keys(draft).length) {
    // Snapshot the pre-publish live state so it can be inspected/restored.
    ops.push(
      prisma.themeHistory.create({
        data: {
          themeId: theme.id,
          tenantId: tenant.id,
          snapshot: toJsonSafe(theme),
          label: `pre-publish v${theme.version}`,
        },
      }),
    );
  }

  ops.push(
    prisma.theme.updateMany({
      where: { tenantId: tenant.id, isActive: true },
      data: { isActive: false },
    }),
    prisma.theme.update({
      where: { id: theme.id },
      data: {
        ...(draft ?? {}),
        draftTokens: Prisma.JsonNull,
        isActive: true,
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    }),
  );

  const results = await prisma.$transaction(ops);
  const published = results[results.length - 1];

  return Response.json({ data: published });
}
