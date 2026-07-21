/**
 * Collection repository — Prisma DATABASE queries ONLY.
 * No business logic. No validation. No cross-feature calls.
 */
import type { Collection as PrismaCollection } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import type { QueryOptions } from '../../../types';
import type { Collection } from '../types';

export interface CreateCollectionRecord {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCollectionRecord {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

type PrismaCollectionWithCount = PrismaCollection & { _count?: { products: number } };

const toCollection = (r: PrismaCollectionWithCount): Collection => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  imageUrl: r.imageUrl ?? undefined,
  imagePublicId: r.imagePublicId ?? undefined,
  isActive: r.isActive,
  displayOrder: r.displayOrder,
  productCount: r._count?.products,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const INCLUDE = { _count: { select: { products: true } } } as const;

export const create = async (data: CreateCollectionRecord): Promise<Collection> => {
  const record = await prisma.collection.create({ data, include: INCLUDE });
  return toCollection(record);
};

export const findById = async (id: string): Promise<Collection | null> => {
  const record = await prisma.collection.findUnique({ where: { id }, include: INCLUDE });
  return record ? toCollection(record) : null;
};

export const findByName = async (name: string): Promise<Collection | null> => {
  const r = await prisma.collection.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  return r ? toCollection(r) : null;
};

export const update = async (id: string, patch: UpdateCollectionRecord): Promise<Collection | null> => {
  try {
    const record = await prisma.collection.update({ where: { id }, data: patch, include: INCLUDE });
    return toCollection(record);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const remove = async (id: string): Promise<boolean> => {
  try {
    await prisma.collection.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return false;
    throw err;
  }
};

const SEARCHABLE_FIELDS: Array<keyof PrismaCollection> = ['name'];

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: Collection[]; total: number }> => {
  const where: Prisma.CollectionWhereInput = {};
  if (typeof options.filters.isActive === 'boolean') where.isActive = options.filters.isActive;
  if (options.search) {
    where.OR = SEARCHABLE_FIELDS.map((f) => ({ [f]: { contains: options.search, mode: 'insensitive' } })) as Prisma.CollectionWhereInput['OR'];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.collection.findMany({
      where, skip: options.skip, take: options.limit, orderBy: { [options.sortBy]: options.sortOrder }, include: INCLUDE,
    }),
    prisma.collection.count({ where }),
  ]);

  return { items: rows.map(toCollection), total };
};

export const findAllActive = async (): Promise<Collection[]> => {
  const rows = await prisma.collection.findMany({
    where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }], include: INCLUDE,
  });
  return rows.map(toCollection);
};

// -------- product membership --------

export const addProducts = async (collectionId: string, productIds: string[]): Promise<void> => {
  await prisma.collection.update({
    where: { id: collectionId },
    data: { products: { connect: productIds.map((id) => ({ id })) } },
  });
};

export const removeProducts = async (collectionId: string, productIds: string[]): Promise<void> => {
  await prisma.collection.update({
    where: { id: collectionId },
    data: { products: { disconnect: productIds.map((id) => ({ id })) } },
  });
};

export const findExistingProductIds = async (ids: string[]): Promise<string[]> => {
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
};
