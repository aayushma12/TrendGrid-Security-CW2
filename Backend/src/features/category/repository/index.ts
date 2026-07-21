/**
 * Category repository — Prisma DATABASE queries ONLY.
 * No business logic. No validation. No cross-feature calls.
 */
import { Prisma, Category as PrismaCategory } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { QueryOptions } from '../../../types';
import { Category, CategoryWithRelations } from '../types';

export interface CreateCategoryRecord {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  parentCategoryId?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateCategoryRecord {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  parentCategoryId?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

const toCategory = (r: PrismaCategory): Category => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  imageUrl: r.imageUrl ?? undefined,
  imagePublicId: r.imagePublicId ?? undefined,
  parentCategoryId: r.parentCategoryId ?? undefined,
  isFeatured: r.isFeatured,
  isActive: r.isActive,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

type PrismaCategoryWithRelations = PrismaCategory & {
  parent: { id: string; name: string } | null;
  _count?: { children: number };
};

const toCategoryWithRelations = (r: PrismaCategoryWithRelations): CategoryWithRelations => ({
  ...toCategory(r),
  parent: r.parent,
  childrenCount: r._count?.children,
});

const INCLUDE = {
  parent: { select: { id: true, name: true } },
  _count: { select: { children: true } },
} as const;

export const create = async (data: CreateCategoryRecord): Promise<CategoryWithRelations> => {
  const record = await prisma.category.create({ data, include: INCLUDE });
  return toCategoryWithRelations(record);
};

export const findById = async (id: string): Promise<CategoryWithRelations | null> => {
  const record = await prisma.category.findUnique({ where: { id }, include: INCLUDE });
  return record ? toCategoryWithRelations(record) : null;
};

export const findByName = async (name: string): Promise<Category | null> => {
  const r = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  return r ? toCategory(r) : null;
};

export const update = async (
  id: string,
  patch: UpdateCategoryRecord,
): Promise<CategoryWithRelations | null> => {
  try {
    const record = await prisma.category.update({ where: { id }, data: patch, include: INCLUDE });
    return toCategoryWithRelations(record);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const remove = async (id: string): Promise<boolean> => {
  try {
    await prisma.category.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return false;
    throw err;
  }
};

export const countChildren = async (id: string): Promise<number> =>
  prisma.category.count({ where: { parentCategoryId: id } });

/** Number of products directly assigned to a category — checked before delete
 *  since Product.category is onDelete: Restrict at the DB level. */
export const countProducts = async (id: string): Promise<number> =>
  prisma.product.count({ where: { categoryId: id } });

// ------------- Bulk operations -------------

export const findExistingIds = async (ids: string[]): Promise<string[]> => {
  const rows = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
};

export const bulkUpdateActive = async (ids: string[], isActive: boolean): Promise<number> => {
  const { count } = await prisma.category.updateMany({ where: { id: { in: ids } }, data: { isActive } });
  return count;
};

/** Return all direct subcategories of a category (id + name + imageUrl only). */
export const findSubcategories = async (
  parentId: string,
): Promise<{ id: string; name: string; imageUrl: string | null; isActive: boolean }[]> => {
  const rows = await prisma.category.findMany({
    where: { parentCategoryId: parentId, isActive: true },
    select: { id: true, name: true, imageUrl: true, isActive: true },
    orderBy: { name: 'asc' },
  });
  return rows;
};

/** Walk parents to detect a cycle if `id` were to have parent `candidateParentId`. */
export const wouldCreateCycle = async (
  id: string,
  candidateParentId: string,
): Promise<boolean> => {
  let current: string | null = candidateParentId;
  const visited = new Set<string>();
  while (current) {
    if (current === id) return true;
    if (visited.has(current)) return true;
    visited.add(current);
    const categoryRecord: { parentCategoryId: string | null } | null = await prisma.category.findUnique({
      where: { id: current },
      select: { parentCategoryId: true },
    });
    current = categoryRecord?.parentCategoryId ?? null;
  }
  return false;
};

const SEARCHABLE_FIELDS: Array<keyof PrismaCategory> = ['name'];

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: CategoryWithRelations[]; total: number }> => {
  const where: Prisma.CategoryWhereInput = {};

  if (typeof options.filters.isActive === 'boolean') where.isActive = options.filters.isActive;
  if (typeof options.filters.isFeatured === 'boolean') where.isFeatured = options.filters.isFeatured;
  if (options.filters.parentCategoryId === null) {
    where.parentCategoryId = null;
  } else if (typeof options.filters.parentCategoryId === 'string') {
    where.parentCategoryId = options.filters.parentCategoryId;
  }

  if (options.search) {
    where.OR = SEARCHABLE_FIELDS.map((f) => ({
      [f]: { contains: options.search, mode: 'insensitive' },
    })) as Prisma.CategoryWhereInput['OR'];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
      include: INCLUDE,
    }),
    prisma.category.count({ where }),
  ]);

  return { items: rows.map(toCategoryWithRelations), total };
};

/**
 * All category ids reachable from `categoryId` (itself included) by walking
 * parentCategoryId downward. Products are only ever assigned to leaf
 * subcategories (see prisma/seedCatalog.ts) — filtering product listings by
 * an exact categoryId match alone means every top-level/parent category
 * always returns zero products. The product service expands a categoryId
 * filter through this before querying, so picking a parent category also
 * returns everything under it.
 *
 * Fetches the whole (small, ~150-row) category table once and walks it in
 * memory rather than recursive queries — cheap at this scale, and correct
 * for a tree of any depth (not just the current two levels).
 */
export const getDescendantIds = async (categoryId: string): Promise<string[]> => {
  const all = await prisma.category.findMany({ select: { id: true, parentCategoryId: true } });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (!c.parentCategoryId) continue;
    const list = childrenOf.get(c.parentCategoryId);
    if (list) list.push(c.id);
    else childrenOf.set(c.parentCategoryId, [c.id]);
  }

  const result: string[] = [];
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    result.push(current);
    const children = childrenOf.get(current);
    if (children) queue.push(...children);
  }
  return result;
};

export const findAllActive = async (): Promise<Category[]> => {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return rows.map(toCategory);
};
