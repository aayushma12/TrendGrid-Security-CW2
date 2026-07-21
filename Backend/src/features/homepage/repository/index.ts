import { Prisma, HomepageSection as PrismaHomepageSection } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { HomepageSection, HomeSectionContent } from '../types';

const toSection = (r: PrismaHomepageSection): HomepageSection => ({
  id: r.id,
  key: r.key,
  name: r.name,
  description: r.description ?? undefined,
  visible: r.visible,
  sortOrder: r.sortOrder,
  content: r.content as unknown as HomeSectionContent,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export const findAllOrdered = async (): Promise<HomepageSection[]> => {
  const rows = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } });
  return rows.map(toSection);
};

export const findVisibleOrdered = async (): Promise<HomepageSection[]> => {
  const rows = await prisma.homepageSection.findMany({
    where: { visible: true },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toSection);
};

export const findById = async (id: string): Promise<HomepageSection | null> => {
  const r = await prisma.homepageSection.findUnique({ where: { id } });
  return r ? toSection(r) : null;
};

export const findAllIds = async (): Promise<string[]> => {
  const rows = await prisma.homepageSection.findMany({ select: { id: true } });
  return rows.map((r) => r.id);
};

export const updateContent = async (
  id: string,
  content: HomeSectionContent,
): Promise<HomepageSection | null> => {
  try {
    const r = await prisma.homepageSection.update({
      where: { id },
      data: { content: content as unknown as Prisma.InputJsonValue },
    });
    return toSection(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const updateVisibility = async (id: string, visible: boolean): Promise<HomepageSection | null> => {
  try {
    const r = await prisma.homepageSection.update({ where: { id }, data: { visible } });
    return toSection(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

/** Sets sortOrder = index for each id in `order`, atomically. */
export const reorder = async (order: string[]): Promise<void> => {
  await prisma.$transaction(
    order.map((id, index) =>
      prisma.homepageSection.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
};
