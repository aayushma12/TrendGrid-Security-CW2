/**
 * Store settings service — admin-editable commerce configuration.
 *
 * Resolution order: saved DB row → env defaults. A short in-process cache
 * keeps checkout from hitting the DB on every price preview; it is
 * invalidated on update.
 */
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

import * as settingsRepo from '../repository';
import {
  StoreSettingsResponseDto, StoreSettingsValues, UpdateStoreSettingsDto, toStoreSettingsResponseDto,
} from '../dto';

const CACHE_TTL_MS = 30_000;

let cache: { values: StoreSettingsValues; expiresAt: number } | null = null;

const envDefaults = (): Omit<StoreSettingsValues, 'updatedAt'> => ({
  taxRate: env.commerce.taxRate,
  shippingFlatRate: env.commerce.shippingFlatRate,
  freeShippingThreshold: env.commerce.freeShippingThreshold,
  codEnabled: true,
  currency: env.commerce.currency,
});

/** Effective settings (DB row when present, env defaults otherwise). Cached. */
export const getEffectiveSettings = async (): Promise<StoreSettingsValues> => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;

  const stored = await settingsRepo.find();
  const values = stored ?? { ...envDefaults() };
  cache = { values, expiresAt: now + CACHE_TTL_MS };
  return values;
};

export const getSettings = async (): Promise<StoreSettingsResponseDto> =>
  toStoreSettingsResponseDto(await getEffectiveSettings());

export const updateSettings = async (dto: UpdateStoreSettingsDto): Promise<StoreSettingsResponseDto> => {
  const updated = await settingsRepo.upsert(envDefaults(), dto);
  cache = null; // next read sees the new values immediately
  logger.info(
    `Store settings updated taxRate=${updated.taxRate} shipping=${updated.shippingFlatRate} freeShipAt=${updated.freeShippingThreshold} cod=${updated.codEnabled}`,
  );
  return toStoreSettingsResponseDto(updated);
};
