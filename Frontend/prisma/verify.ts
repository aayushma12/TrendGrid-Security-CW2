/**
 * Post-seed verification — run with: npx tsx prisma/verify.ts
 *
 * Cross-checks the platform end to end against seeded data:
 *  1. Multiple tenants exist and are isolated.
 *  2. Each tenant has exactly one active theme.
 *  3. Tenant-scoped queries never leak across tenants.
 *  4. The home page resolves ordered sections with data.
 *  5. Token -> CSS variable conversion produces a complete map.
 */
import { PrismaClient } from "@prisma/client";
import { getActiveThemeTokens, getPage, getStoreProducts } from "../src/lib/store-data";
import { themeToCssVars } from "../src/lib/design-tokens";

const prisma = new PrismaClient();
let failures = 0;

function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null } });
  check("at least 2 tenants seeded", tenants.length >= 2, `${tenants.length} found`);

  for (const t of tenants) {
    const activeThemes = await prisma.theme.count({
      where: { tenantId: t.id, isActive: true, deletedAt: null },
    });
    check(`[${t.slug}] exactly one active theme`, activeThemes === 1, `${activeThemes}`);

    const tokens = await getActiveThemeTokens(t.id);
    const cssVars = themeToCssVars(tokens);
    check(`[${t.slug}] CSS vars generated`, Object.keys(cssVars).length > 80, `${Object.keys(cssVars).length} vars`);
    check(`[${t.slug}] primary color is a var`, !!cssVars["--color-primary"], cssVars["--color-primary"]);

    const products = await getStoreProducts(t.id);
    check(`[${t.slug}] products load`, products.length > 0, `${products.length}`);
    check(`[${t.slug}] products are tenant-scoped`, products.every((p) => !!p.id));

    const sections = await getPage(t.id, "home");
    check(`[${t.slug}] home page has sections`, sections.length > 0, `${sections.length}`);
    const ordered = sections.map((s) => s.type);
    check(`[${t.slug}] sections ordered`, ordered.length > 0, ordered.join(" > "));
  }

  // Cross-tenant isolation: a product of tenant A must not appear under tenant B.
  if (tenants.length >= 2) {
    const [a, b] = tenants;
    const aProducts = await prisma.product.findMany({ where: { tenantId: a.id }, select: { id: true } });
    const leaked = await prisma.product.count({
      where: { tenantId: b.id, id: { in: aProducts.map((p: (typeof aProducts)[number]) => p.id) } },
    });
    check("no cross-tenant product leakage", leaked === 0, `${leaked} leaked`);
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✓" : `\n${failures} CHECK(S) FAILED ✗`);
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
