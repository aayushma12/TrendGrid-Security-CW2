export interface StoreSettingsResponseDto {
  /** Fraction, e.g. 0.13 = 13% VAT. */
  taxRate: number;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  currency: string;
  updatedAt: string | null;
}

export interface UpdateStoreSettingsDto {
  taxRate?: number;
  shippingFlatRate?: number;
  freeShippingThreshold?: number;
  codEnabled?: boolean;
  currency?: string;
}

export interface StoreSettingsValues {
  taxRate: number;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  currency: string;
  updatedAt?: Date;
}

export const toStoreSettingsResponseDto = (s: StoreSettingsValues): StoreSettingsResponseDto => ({
  taxRate: s.taxRate,
  shippingFlatRate: s.shippingFlatRate,
  freeShippingThreshold: s.freeShippingThreshold,
  codEnabled: s.codEnabled,
  currency: s.currency,
  updatedAt: s.updatedAt?.toISOString() ?? null,
});
