import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { SETTINGS_ID } from '../constants';
import { StoreSettingsValues, UpdateStoreSettingsDto } from '../dto';

type Row = {
  taxRate: Prisma.Decimal;
  shippingFlatRate: Prisma.Decimal;
  freeShippingThreshold: Prisma.Decimal;
  codEnabled: boolean;
  currency: string;
  updatedAt: Date;
};

const toValues = (r: Row): StoreSettingsValues => ({
  taxRate: Number(r.taxRate),
  shippingFlatRate: Number(r.shippingFlatRate),
  freeShippingThreshold: Number(r.freeShippingThreshold),
  codEnabled: r.codEnabled,
  currency: r.currency,
  updatedAt: r.updatedAt,
});

/** The singleton settings row, or null when it has never been saved. */
export const find = async (): Promise<StoreSettingsValues | null> => {
  const r = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  return r ? toValues(r) : null;
};

/**
 * Upsert the singleton row. `defaults` (from env) fill any column the row
 * doesn't have yet on first save; `patch` carries the admin's changes.
 */
export const upsert = async (
  defaults: Omit<StoreSettingsValues, 'updatedAt'>,
  patch: UpdateStoreSettingsDto,
): Promise<StoreSettingsValues> => {
  const r = await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      taxRate: new Prisma.Decimal(patch.taxRate ?? defaults.taxRate),
      shippingFlatRate: new Prisma.Decimal(patch.shippingFlatRate ?? defaults.shippingFlatRate),
      freeShippingThreshold: new Prisma.Decimal(patch.freeShippingThreshold ?? defaults.freeShippingThreshold),
      codEnabled: patch.codEnabled ?? defaults.codEnabled,
      currency: patch.currency ?? defaults.currency,
    },
    update: {
      ...(patch.taxRate !== undefined ? { taxRate: new Prisma.Decimal(patch.taxRate) } : {}),
      ...(patch.shippingFlatRate !== undefined ? { shippingFlatRate: new Prisma.Decimal(patch.shippingFlatRate) } : {}),
      ...(patch.freeShippingThreshold !== undefined
        ? { freeShippingThreshold: new Prisma.Decimal(patch.freeShippingThreshold) }
        : {}),
      ...(patch.codEnabled !== undefined ? { codEnabled: patch.codEnabled } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
    },
  });
  return toValues(r);
};
