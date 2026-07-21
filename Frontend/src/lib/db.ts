import { DEFAULT_THEME_TOKENS } from "./theme-defaults";
import { PRODUCTS } from "./shop-data";

type Row = Record<string, unknown>;

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  deletedAt: Date | null;
  createdAt: Date;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
};

type CustomerRow = {
  id: string;
  tenantId: string;
  userId: string;
  totalOrders: number;
  totalSpent: number;
  deletedAt: Date | null;
};

type OrderItemRow = { id: string; title: string; quantity: number };

type OrderAddressRow = {
  id: string;
  tenantId: string;
  orderId: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: string;
  createdAt: Date;
};

type OrderRow = {
  id: string;
  tenantId: string;
  userId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: Date;
  deletedAt: Date | null;
  items: OrderItemRow[];
};

type WishlistRow = {
  id: string;
  tenantId: string;
  userId: string;
  items: Array<{ productId: string; title: string; image: string; price: number; slug: string }>;
};

type StoreSettingsRow = {
  id: string;
  tenantId: string;
  currency: string;
  locale: string;
};

type ThemeRow = {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  publishedAt: Date | null;
  draftTokens: Record<string, unknown> | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>;

type ThemeHistoryRow = {
  id: string;
  themeId: string;
  tenantId: string;
  snapshot: object;
  label: string;
  savedAt: Date;
};

type PageRow = {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  publishedAt: Date | null;
};

type SectionRow = {
  id: string;
  tenantId: string;
  pageId: string;
  type: string;
  order: number;
  isVisible: boolean;
  mobileHidden: boolean;
  tabletHidden: boolean;
  desktopHidden: boolean;
  anchorId: string | null;
  customClasses: string | null;
  settingsJson: Record<string, unknown>;
  deletedAt: Date | null;
  createdAt: Date;
};

type BlockRow = {
  id: string;
  sectionId: string;
  order: number;
  type: string;
  contentJson: Record<string, unknown>;
};

let idCounter = 1;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

const now = new Date();

const TENANTS: TenantRow[] = [
  {
    id: "tenant_demo",
    name: "TrendGrid Demo",
    slug: "trendgrid-demo",
    subdomain: "trendgrid",
    customDomain: null,
    deletedAt: null,
    createdAt: now,
  },
  {
    id: "tenant_aurora",
    name: "Aurora Boutique",
    slug: "aurora-boutique",
    subdomain: "aurora",
    customDomain: null,
    deletedAt: null,
    createdAt: now,
  },
];

const USERS: UserRow[] = [
  {
    id: "user_demo_owner",
    firstName: "Demo",
    lastName: "Owner",
    email: "owner@trendgrid.local",
    createdAt: now,
  },
  {
    id: "user_aurora_owner",
    firstName: "Aurora",
    lastName: "Owner",
    email: "owner@aurora.local",
    createdAt: now,
  },
];

const CUSTOMERS: CustomerRow[] = [
  {
    id: "cust_demo_1",
    tenantId: "tenant_demo",
    userId: "user_demo_owner",
    totalOrders: 2,
    totalSpent: 210,
    deletedAt: null,
  },
  {
    id: "cust_aurora_1",
    tenantId: "tenant_aurora",
    userId: "user_aurora_owner",
    totalOrders: 1,
    totalSpent: 120,
    deletedAt: null,
  },
];

const ORDERS: OrderRow[] = [
  {
    id: "order_demo_1",
    tenantId: "tenant_demo",
    userId: "user_demo_owner",
    orderNumber: "TG-1001",
    status: "delivered",
    paymentStatus: "paid",
    total: 120,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
    deletedAt: null,
    items: [{ id: "item_1", title: "Classic White Shirt", quantity: 2 }],
  },
  {
    id: "order_demo_2",
    tenantId: "tenant_demo",
    userId: "user_demo_owner",
    orderNumber: "TG-1002",
    status: "processing",
    paymentStatus: "paid",
    total: 90,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    deletedAt: null,
    items: [{ id: "item_2", title: "Modern Brown Dress", quantity: 1 }],
  },
  {
    id: "order_aurora_1",
    tenantId: "tenant_aurora",
    userId: "user_aurora_owner",
    orderNumber: "AU-2001",
    status: "delivered",
    paymentStatus: "paid",
    total: 120,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
    deletedAt: null,
    items: [{ id: "item_3", title: "Classic Gold Watch", quantity: 1 }],
  },
];

const ORDER_ADDRESSES: OrderAddressRow[] = [
  {
    id: "addr_demo_1",
    tenantId: "tenant_demo",
    orderId: "order_demo_1",
    firstName: "Demo",
    lastName: "Owner",
    line1: "8502 Preston Rd",
    line2: null,
    city: "Inglewood",
    state: "Maine",
    zip: "98380",
    country: "USA",
    type: "shipping",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
  },
  {
    id: "addr_demo_2",
    tenantId: "tenant_demo",
    orderId: "order_demo_2",
    firstName: "Demo",
    lastName: "Owner",
    line1: "8502 Preston Rd",
    line2: null,
    city: "Inglewood",
    state: "Maine",
    zip: "98380",
    country: "USA",
    type: "billing",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
  },
];

const WISHLISTS: WishlistRow[] = [
  {
    id: "wish_demo_1",
    tenantId: "tenant_demo",
    userId: "user_demo_owner",
    items: PRODUCTS.slice(0, 3).map((p) => ({
      productId: p.id,
      title: p.name,
      image: `https://picsum.photos/seed/${p.id}/400/500`,
      price: p.price,
      slug: p.id,
    })),
  },
];

const STORE_SETTINGS: StoreSettingsRow[] = TENANTS.map((t) => ({
  id: `settings_${t.id}`,
  tenantId: t.id,
  currency: "USD",
  locale: "en-US",
}));

const THEMES: ThemeRow[] = TENANTS.map((t, idx) => ({
  id: `theme_${t.id}`,
  tenantId: t.id,
  name: idx === 0 ? "Default" : "Aurora",
  isActive: true,
  isDefault: true,
  version: 1,
  publishedAt: now,
  draftTokens: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  ...DEFAULT_THEME_TOKENS,
}));

const THEME_HISTORY: ThemeHistoryRow[] = [];

const PAGES: PageRow[] = TENANTS.map((t) => ({
  id: `page_home_${t.id}`,
  tenantId: t.id,
  title: "Home",
  slug: "home",
  type: "home",
  status: "published",
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  publishedAt: now,
}));

const SECTIONS: SectionRow[] = [
  {
    id: "section_home_hero_demo",
    tenantId: "tenant_demo",
    pageId: "page_home_tenant_demo",
    type: "fashion_hero",
    order: 0,
    isVisible: true,
    mobileHidden: false,
    tabletHidden: false,
    desktopHidden: false,
    anchorId: null,
    customClasses: null,
    settingsJson: {
      heading: "Step into Style",
      subtext: "A Prisma-free demo data mode is active.",
      ctaText: "Shop now",
      ctaLink: "/shop",
    },
    deletedAt: null,
    createdAt: now,
  },
  {
    id: "section_home_top_demo",
    tenantId: "tenant_demo",
    pageId: "page_home_tenant_demo",
    type: "top_sellers",
    order: 1,
    isVisible: true,
    mobileHidden: false,
    tabletHidden: false,
    desktopHidden: false,
    anchorId: null,
    customClasses: null,
    settingsJson: {
      heading: "Our top sellers",
      limit: 8,
    },
    deletedAt: null,
    createdAt: now,
  },
];

const BLOCKS: BlockRow[] = [];

function withOrder<T extends { [key: string]: unknown }>(rows: T[], orderBy?: Record<string, "asc" | "desc">): T[] {
  if (!orderBy) return rows;
  const [key, dir] = Object.entries(orderBy)[0] ?? [];
  if (!key) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av instanceof Date && bv instanceof Date) {
      return av.getTime() - bv.getTime();
    }
    if (typeof av === "number" && typeof bv === "number") {
      return av - bv;
    }
    return String(av ?? "").localeCompare(String(bv ?? ""));
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_k, v) => (v instanceof Date ? v.toISOString() : v))) as T;
}

function eqOrUndef<T>(left: T, right: T | undefined): boolean {
  return right === undefined || left === right;
}

function isNullOrUndef(value: unknown): boolean {
  return value === null || value === undefined;
}

const NUMERIC_OPS = new Set(["increment", "decrement", "multiply", "divide", "set"]);

/** Applies a Prisma-style update `data` object to a row, honoring scalar field
 *  update operators (`{ increment }`, `{ decrement }`, `{ multiply }`,
 *  `{ divide }`, `{ set }`) instead of overwriting the field with the raw
 *  operator object -- a plain `Object.assign` would otherwise store e.g.
 *  `version: { increment: 1 }` literally instead of incrementing it. */
function applyUpdateData<T extends Record<string, unknown>>(row: T, data: Row): void {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const ops = Object.keys(value as Row);
      if (ops.length === 1 && NUMERIC_OPS.has(ops[0])) {
        const opValue = (value as Row)[ops[0]] as number;
        const current = typeof (row as Row)[key] === "number" ? ((row as Row)[key] as number) : 0;
        switch (ops[0]) {
          case "increment":
            (row as Row)[key] = current + opValue;
            continue;
          case "decrement":
            (row as Row)[key] = current - opValue;
            continue;
          case "multiply":
            (row as Row)[key] = current * opValue;
            continue;
          case "divide":
            (row as Row)[key] = current / opValue;
            continue;
          case "set":
            (row as Row)[key] = opValue;
            continue;
        }
      }
    }
    (row as Row)[key] = value;
  }
}

const prismaImpl = {
  tenant: {
    async findMany(args: { where?: Row; select?: Row; orderBy?: Row } = {}) {
      const rows = TENANTS.filter((t) => {
        const where = args.where ?? {};
        return eqOrUndef(t.id, where.id as string | undefined)
          && eqOrUndef(t.slug, where.slug as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(t.deletedAt) : true);
      });
      const ordered = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      if (!args.select) return clone(ordered);
      const keys = Object.keys(args.select).filter((k) => args.select?.[k]);
      return clone(ordered.map((r) => Object.fromEntries(keys.map((k) => [k, (r as Row)[k]]))));
    },
    async findFirst(args: { where?: Row } = {}) {
      const where = args.where ?? {};
      const or = Array.isArray(where.OR) ? (where.OR as Row[]) : [];
      const row = TENANTS.find((t) => {
        const base = eqOrUndef(t.id, where.id as string | undefined)
          && eqOrUndef(t.slug, where.slug as string | undefined)
          && eqOrUndef(t.subdomain, where.subdomain as string | null | undefined)
          && eqOrUndef(t.customDomain, where.customDomain as string | null | undefined)
          && (where.deletedAt === null ? isNullOrUndef(t.deletedAt) : true);
        if (!base) return false;
        if (!or.length) return true;
        return or.some((cond) => {
          return eqOrUndef(t.slug, cond.slug as string | undefined)
            && eqOrUndef(t.subdomain, cond.subdomain as string | undefined);
        });
      });
      return row ? clone(row) : null;
    },
  },

  customer: {
    async findMany(args: { where?: Row; include?: Row; orderBy?: Row } = {}) {
      let rows = CUSTOMERS.filter((c) => {
        const where = args.where ?? {};
        return eqOrUndef(c.tenantId, where.tenantId as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(c.deletedAt) : true);
      });
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      const includeUser = Boolean(args.include?.user);
      const data = rows.map((c) => {
        if (!includeUser) return c;
        const user = USERS.find((u) => u.id === c.userId) ?? null;
        return { ...c, user };
      });
      return clone(data);
    },
  },

  order: {
    async findMany(args: { where?: Row; orderBy?: Row; include?: Row; take?: number } = {}) {
      let rows = ORDERS.filter((o) => {
        const where = args.where ?? {};
        return eqOrUndef(o.tenantId, where.tenantId as string | undefined)
          && eqOrUndef(o.userId, where.userId as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(o.deletedAt) : true);
      });
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      if (typeof args.take === "number") rows = rows.slice(0, args.take);

      const includeItems = Boolean(args.include?.items);
      const includeCount = Boolean((args.include?._count as Row | undefined)?.select);

      const data = rows.map((o) => {
        const out: Row = { ...o };
        if (!includeItems) delete out.items;
        if (includeCount) out._count = { items: o.items.length };
        return out;
      });
      return clone(data);
    },
  },

  orderAddress: {
    async findMany(args: { where?: Row; orderBy?: Row } = {}) {
      let rows = ORDER_ADDRESSES.filter((a) => {
        const where = args.where ?? {};
        const orderFilter = where.order as Row | undefined;
        const orderRow = ORDERS.find((o) => o.id === a.orderId);
        const userMatches = orderFilter?.userId
          ? orderRow?.userId === orderFilter.userId
          : true;
        return eqOrUndef(a.tenantId, where.tenantId as string | undefined) && userMatches;
      });
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      return clone(rows);
    },
  },

  wishlist: {
    async findFirst(args: { where?: Row } = {}) {
      const where = args.where ?? {};
      const row = WISHLISTS.find((w) => {
        return eqOrUndef(w.tenantId, where.tenantId as string | undefined)
          && eqOrUndef(w.userId, where.userId as string | undefined);
      });
      return row ? clone(row) : null;
    },
  },

  storeSettings: {
    async findFirst(args: { where?: Row } = {}) {
      const where = args.where ?? {};
      const row = STORE_SETTINGS.find((s) => eqOrUndef(s.tenantId, where.tenantId as string | undefined));
      return row ? clone(row) : null;
    },
  },

  theme: {
    async findFirst(args: { where?: Row } = {}) {
      const where = args.where ?? {};
      const row = THEMES.find((t) => {
        return eqOrUndef(t.id, where.id as string | undefined)
          && eqOrUndef(t.tenantId, where.tenantId as string | undefined)
          && (where.isActive === undefined || t.isActive === where.isActive)
          && (where.deletedAt === null ? isNullOrUndef(t.deletedAt) : true);
      });
      return row ? clone(row) : null;
    },
    async update(args: { where: Row; data: Row }) {
      const row = THEMES.find((t) => t.id === args.where.id);
      if (!row) throw new Error("Theme not found");
      applyUpdateData(row, args.data);
      row.updatedAt = new Date();
      return clone(row);
    },
    async updateMany(args: { where?: Row; data: Row }) {
      const where = args.where ?? {};
      let count = 0;
      for (const row of THEMES) {
        const matches = eqOrUndef(row.tenantId, where.tenantId as string | undefined)
          && (where.isActive === undefined || row.isActive === where.isActive);
        if (!matches) continue;
        applyUpdateData(row, args.data);
        row.updatedAt = new Date();
        count += 1;
      }
      return { count };
    },
  },

  themeHistory: {
    async create(args: { data: Row }) {
      const row: ThemeHistoryRow = {
        id: makeId("th"),
        themeId: String(args.data.themeId),
        tenantId: String(args.data.tenantId),
        snapshot: (args.data.snapshot as object) ?? {},
        label: String(args.data.label ?? "snapshot"),
        savedAt: new Date(),
      };
      THEME_HISTORY.push(row);
      return clone(row);
    },
    async findMany(args: { where?: Row; orderBy?: Row; skip?: number; select?: Row } = {}) {
      const where = args.where ?? {};
      let rows = THEME_HISTORY.filter((h) => eqOrUndef(h.themeId, where.themeId as string | undefined));
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      if (typeof args.skip === "number") rows = rows.slice(args.skip);
      if (!args.select) return clone(rows);
      const keys = Object.keys(args.select).filter((k) => args.select?.[k]);
      return clone(rows.map((r) => Object.fromEntries(keys.map((k) => [k, (r as Row)[k]]))));
    },
    async deleteMany(args: { where?: Row } = {}) {
      const where = args.where ?? {};
      const ids = (where.id as Row | undefined)?.in as string[] | undefined;
      if (!ids?.length) return { count: 0 };
      const before = THEME_HISTORY.length;
      for (let i = THEME_HISTORY.length - 1; i >= 0; i -= 1) {
        if (ids.includes(THEME_HISTORY[i].id)) THEME_HISTORY.splice(i, 1);
      }
      return { count: before - THEME_HISTORY.length };
    },
  },

  page: {
    async findMany(args: { where?: Row; orderBy?: Row; include?: Row } = {}) {
      const where = args.where ?? {};
      let rows = PAGES.filter((p) => {
        return eqOrUndef(p.tenantId, where.tenantId as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(p.deletedAt) : true);
      });
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      const includeCount = Boolean((args.include?._count as Row | undefined)?.select);
      const data = rows.map((p) => {
        if (!includeCount) return p;
        const sectionCount = SECTIONS.filter((s) => s.pageId === p.id && s.deletedAt === null).length;
        return { ...p, _count: { sections: sectionCount } };
      });
      return clone(data);
    },
    async findFirst(args: { where?: Row; include?: Row; select?: Row } = {}) {
      const where = args.where ?? {};
      const row = PAGES.find((p) => {
        return eqOrUndef(p.id, where.id as string | undefined)
          && eqOrUndef(p.tenantId, where.tenantId as string | undefined)
          && eqOrUndef(p.slug, where.slug as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(p.deletedAt) : true);
      });
      if (!row) return null;
      if (args.select) {
        const keys = Object.keys(args.select).filter((k) => args.select?.[k]);
        return clone(Object.fromEntries(keys.map((k) => [k, (row as Row)[k]])));
      }
      if (args.include?.sections) {
        const sectionInclude = args.include.sections as Row;
        const whereSection = (sectionInclude.where as Row | undefined) ?? {};
        let sections = SECTIONS.filter((s) => {
          return s.pageId === row.id
            && (whereSection.deletedAt === null ? isNullOrUndef(s.deletedAt) : true);
        });
        sections = withOrder(sections, sectionInclude.orderBy as Record<string, "asc" | "desc"> | undefined);

        const includeBlocks = sectionInclude.include as Row | undefined;
        const withBlocks = sections.map((s) => {
          if (!includeBlocks?.blocks) return s;
          const blocksCfg = includeBlocks.blocks as Row;
          let blocks = BLOCKS.filter((b) => b.sectionId === s.id);
          blocks = withOrder(blocks, blocksCfg.orderBy as Record<string, "asc" | "desc"> | undefined);
          return { ...s, blocks };
        });
        return clone({ ...row, sections: withBlocks });
      }
      return clone(row);
    },
    async create(args: { data: Row }) {
      const row: PageRow = {
        id: makeId("page"),
        tenantId: String(args.data.tenantId),
        title: String(args.data.title),
        slug: String(args.data.slug),
        type: String(args.data.type),
        status: String(args.data.status ?? "draft"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        publishedAt: (args.data.publishedAt as Date | null | undefined) ?? null,
      };
      PAGES.push(row);
      return clone(row);
    },
  },

  section: {
    async findFirst(args: { where?: Row; orderBy?: Row; select?: Row } = {}) {
      const where = args.where ?? {};
      let rows = SECTIONS.filter((s) => {
        return eqOrUndef(s.id, where.id as string | undefined)
          && eqOrUndef(s.pageId, where.pageId as string | undefined)
          && eqOrUndef(s.tenantId, where.tenantId as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(s.deletedAt) : true);
      });
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      const row = rows[0];
      if (!row) return null;
      if (!args.select) return clone(row);
      const keys = Object.keys(args.select).filter((k) => args.select?.[k]);
      return clone(Object.fromEntries(keys.map((k) => [k, (row as Row)[k]])));
    },
    async create(args: { data: Row }) {
      const row: SectionRow = {
        id: makeId("section"),
        tenantId: String(args.data.tenantId),
        pageId: String(args.data.pageId),
        type: String(args.data.type),
        order: Number(args.data.order ?? 0),
        isVisible: Boolean(args.data.isVisible ?? true),
        mobileHidden: Boolean(args.data.mobileHidden ?? false),
        tabletHidden: Boolean(args.data.tabletHidden ?? false),
        desktopHidden: Boolean(args.data.desktopHidden ?? false),
        anchorId: (args.data.anchorId as string | null | undefined) ?? null,
        customClasses: (args.data.customClasses as string | null | undefined) ?? null,
        settingsJson: (args.data.settingsJson as Record<string, unknown> | undefined) ?? {},
        deletedAt: null,
        createdAt: new Date(),
      };
      SECTIONS.push(row);
      return clone(row);
    },
    async updateMany(args: { where?: Row; data: Row }) {
      const where = args.where ?? {};
      let count = 0;
      for (const row of SECTIONS) {
        const matches = eqOrUndef(row.id, where.id as string | undefined)
          && eqOrUndef(row.pageId, where.pageId as string | undefined)
          && eqOrUndef(row.tenantId, where.tenantId as string | undefined)
          && (where.deletedAt === null ? isNullOrUndef(row.deletedAt) : true);
        if (!matches) continue;
        Object.assign(row, args.data);
        count += 1;
      }
      return { count };
    },
  },

  product: {
    async findMany(args: { where?: Row; include?: Row; orderBy?: Row; take?: number } = {}) {
      const where = args.where ?? {};
      const tenantId = where.tenantId as string | undefined;
      const tenantTag = tenantId === "tenant_aurora" ? "aurora" : "trendgrid";
      let rows = PRODUCTS.map((p, idx) => {
        return {
          id: `${tenantTag}_${p.id}`,
          tenantId: tenantId ?? "tenant_demo",
          title: p.name,
          slug: p.id,
          shortDescription: `${p.category} for ${p.audience}`,
          status: "active",
          deletedAt: null,
          createdAt: new Date(now.getTime() - idx * 1000 * 60 * 60),
          category: { name: p.category },
          images: [{ url: `https://picsum.photos/seed/${p.id}/640/800`, isPrimary: true }],
          variants: [{ isDefault: true, price: p.price, compareAtPrice: p.compareAtPrice }],
        };
      });
      rows = withOrder(rows, args.orderBy as Record<string, "asc" | "desc"> | undefined);
      if (typeof args.take === "number") rows = rows.slice(0, args.take);
      return clone(rows);
    },
  },

  async $transaction<T extends readonly unknown[]>(
    ops: readonly [...{ [K in keyof T]: Promise<T[K]> }],
  ): Promise<T> {
    return Promise.all(ops) as Promise<T>;
  },
};

export const prisma = prismaImpl;

export default prisma;
