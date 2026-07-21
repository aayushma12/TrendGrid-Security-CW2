import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { ProductCharacteristic } from '../types';

const toChar = (r: Prisma.ProductCharacteristicGetPayload<null>): ProductCharacteristic => ({
  id: r.id, productId: r.productId,
  name: r.name, value: r.value, position: r.position,
  createdAt: r.createdAt, updatedAt: r.updatedAt,
});

export const create = async (
  productId: string,
  data: { name: string; value: string; position?: number },
): Promise<ProductCharacteristic> =>
  toChar(await prisma.productCharacteristic.create({
    data: { productId, name: data.name, value: data.value, position: data.position ?? 0 },
  }));

export const findById = async (productId: string, charId: string): Promise<ProductCharacteristic | null> => {
  const r = await prisma.productCharacteristic.findFirst({ where: { id: charId, productId } });
  return r ? toChar(r) : null;
};

export const findByName = async (productId: string, name: string): Promise<ProductCharacteristic | null> => {
  const r = await prisma.productCharacteristic.findUnique({
    where: { productId_name: { productId, name } },
  });
  return r ? toChar(r) : null;
};

export const listByProduct = async (productId: string): Promise<ProductCharacteristic[]> => {
  const rows = await prisma.productCharacteristic.findMany({
    where: { productId }, orderBy: { position: 'asc' },
  });
  return rows.map(toChar);
};

export const update = async (
  productId: string, charId: string,
  patch: { name?: string; value?: string; position?: number },
): Promise<ProductCharacteristic | null> => {
  try {
    const r = await prisma.productCharacteristic.update({
      where: { id: charId },
      data: patch,
    });
    if (r.productId !== productId) return null;
    return toChar(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const remove = async (productId: string, charId: string): Promise<boolean> => {
  const existing = await prisma.productCharacteristic.findFirst({ where: { id: charId, productId } });
  if (!existing) return false;
  await prisma.productCharacteristic.delete({ where: { id: charId } });
  return true;
};
