import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAccountContext } from "@/lib/account";
import { AccountShell } from "@/components/account/AccountShell";
import { acctMoney, AcctEmpty, NoCustomer } from "@/components/account/helpers";

export const dynamic = "force-dynamic";

interface WishItem { productId?: string; title?: string; image?: string; price?: number; slug?: string }

export default async function AccountWishlist({ searchParams }: { searchParams: Promise<{ tenant?: string; customer?: string }> }) {
  const ctx = await getAccountContext(searchParams);
  if (!ctx.tenant || !ctx.customer || !ctx.user) return <NoCustomer title="Wishlist" />;

  const wishlist = await prisma.wishlist.findFirst({ where: { tenantId: ctx.tenant.id, userId: ctx.user.id } });
  const items: WishItem[] = Array.isArray(wishlist?.items) ? (wishlist!.items as WishItem[]) : [];
  const name = `${ctx.user.firstName ?? ""} ${ctx.user.lastName ?? ""}`.trim() || "there";

  return (
    <AccountShell userName={name} tenants={ctx.tenants} currentTenant={ctx.tenant.slug}
      customers={ctx.customerOptions}
      currentCustomer={ctx.user.id}>

      <div className="acct-card">
        <div className="acct-card__head" style={{ justifyContent: "space-between" }}>
          <span>Saved items {items.length > 0 && <span style={{ color: "var(--muted)", fontWeight: 600 }}>· {items.length}</span>}</span>
          <Link href="/shop" className="acct-btn acct-btn--ghost" style={{ padding: "0.45rem 0.95rem", fontSize: "0.8rem" }}>Continue shopping</Link>
        </div>
        <div className="acct-card__body">
          {items.length === 0 ? (
            <AcctEmpty icon="♥" title="Your wishlist is empty" hint="Tap the heart on any product to save it here for later." />
          ) : (
            <div className="acct-grid">
              {items.map((it, i) => (
                <article className="acct-prod" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="acct-prod__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image ?? "https://placehold.co/400x500"} alt={it.title ?? "Saved item"} />
                    <button className="acct-prod__fav" type="button" aria-label={`Remove ${it.title ?? "item"} from wishlist`}>♥</button>
                    <Link className="acct-prod__view" href={it.slug ? `/shop/${it.slug}` : "/shop"}>View product →</Link>
                  </div>
                  <div className="acct-prod__b">
                    <div className="acct-prod__name">{it.title ?? "Untitled piece"}</div>
                    <div className="acct-prod__price">{acctMoney(it.price ?? null)}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
