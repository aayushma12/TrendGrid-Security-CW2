import {
  Product,
  ProductCharacteristic,
  ProductVariant,
  ProductVariantImage,
  ProductWithRelations,
} from '../types';
import { ProductStatusValue, ProductToggleFlag } from '../constants';

// ---------- Product ----------

export interface CreateProductDto {
  name: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  discountPrice?: number;
  currency?: string;
  categoryId: string;
  brand?: string;
  status?: ProductStatusValue;

  isActive?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;

  sizes?: string[];
  colors?: { name: string; hexCode: string }[];
  tags?: string[];
  labels?: string[];
  collections?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  basePrice?: number;
  discountPrice?: number | null;
  currency?: string;
  categoryId?: string;
  brand?: string | null;
  status?: ProductStatusValue;

  isActive?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface UpdateProductStatusDto { status: ProductStatusValue }
export interface UpdateProductFlagDto { value: boolean }

export interface UpdateAssignmentsDto {
  sizes?: string[];
  colors?: { name: string; hexCode: string }[];
  tags?: string[];
  labels?: string[];
  collections?: string[];
}

/** A single image slot on a product. */
export interface ProductImageDto {
  slot: 'thumbnail' | 'extra1' | 'extra2' | 'extra3';
  url: string;
  publicId: string;
}

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;

  /** Structured image array — up to 4 slots. Only populated slots are included. */
  images: ProductImageDto[];

  basePrice: number;
  discountPrice: number | null;
  currency: string;

  category?: { id: string; name: string } | null;
  brand?: string | null;

  status: ProductStatusValue;
  isActive: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;

  sizes?: string[];
  colors?: { name: string; hexCode: string }[];
  tags?: string[];
  labels?: string[];
  collections?: string[];

  characteristics?: CharacteristicResponseDto[];
  variants?: VariantResponseDto[];
  variantsCount?: number;

  createdAt: string;
  updatedAt: string;
}

// ---------- Characteristic ----------

export interface CreateCharacteristicDto {
  name: string;
  value: string;
  position?: number;
}
export interface UpdateCharacteristicDto {
  name?: string;
  value?: string;
  position?: number;
}
export interface CharacteristicResponseDto {
  id: string;
  name: string;
  value: string;
  position: number;
}



// ---------- Variant ----------

export interface CreateVariantDto {
  color?: string;
  size?: string;
  sku: string;
  barcode?: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}
export interface UpdateVariantDto {
  color?: string | null;
  size?: string | null;
  sku?: string;
  barcode?: string | null;
  price?: number;
  discountPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number | null;
  isActive?: boolean;
}
export interface VariantImageResponseDto {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  position: number;
}
export interface VariantResponseDto {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
  isActive: boolean;
  images: VariantImageResponseDto[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Mappers ----------

const toNumber = (v: unknown): number => Number(v ?? 0);
const optNumber = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));



export const toCharacteristicDto = (c: ProductCharacteristic): CharacteristicResponseDto => ({
  id: c.id, name: c.name, value: c.value, position: c.position,
});

export const toVariantImageDto = (i: ProductVariantImage): VariantImageResponseDto => ({
  id: i.id, imageUrl: i.imageUrl, imagePublicId: i.imagePublicId, position: i.position,
});

export const toVariantDto = (v: ProductVariant): VariantResponseDto => ({
  id: v.id,
  productId: v.productId,
  color: v.color ?? null,
  size: v.size ?? null,
  sku: v.sku,
  barcode: v.barcode ?? null,
  price: toNumber(v.price),
  discountPrice: optNumber(v.discountPrice),
  stock: v.stock,
  lowStockThreshold: v.lowStockThreshold ?? null,
  isActive: v.isActive,
  images: (v.images ?? []).map(toVariantImageDto),
  createdAt: v.createdAt.toISOString(),
  updatedAt: v.updatedAt.toISOString(),
});

/** Build the images array from the 4 scalar slots on the Product model. */
const buildImagesArray = (p: Product): ProductImageDto[] => {
  const images: ProductImageDto[] = [];
  if (p.imageUrl && p.imagePublicId)       images.push({ slot: 'thumbnail', url: p.imageUrl,       publicId: p.imagePublicId });
  if (p.extraImage1Url && p.extraImage1PublicId) images.push({ slot: 'extra1', url: p.extraImage1Url, publicId: p.extraImage1PublicId });
  if (p.extraImage2Url && p.extraImage2PublicId) images.push({ slot: 'extra2', url: p.extraImage2Url, publicId: p.extraImage2PublicId });
  if (p.extraImage3Url && p.extraImage3PublicId) images.push({ slot: 'extra3', url: p.extraImage3Url, publicId: p.extraImage3PublicId });
  return images;
};

export const toProductResponseDto = (p: ProductWithRelations | Product): ProductResponseDto => {
  const rel = p as ProductWithRelations;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    shortDescription: p.shortDescription ?? null,
    images: buildImagesArray(p),
    basePrice: toNumber(p.basePrice),
    discountPrice: optNumber(p.discountPrice),
    currency: p.currency,

    category: rel.category ?? null,
    brand: p.brand ?? null,

    status: p.status,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isRecommended: p.isRecommended,
    isTrending: p.isTrending,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,

    sizes: p.sizes,
    colors: p.colors,
    tags: p.tags,
    labels: p.labels,
    collections: p.collections,

    characteristics: rel.characteristics?.map(toCharacteristicDto),
    variants: rel.variants?.map(toVariantDto),
    variantsCount: rel.variantsCount,

    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
};

// Re-export the flag list type at DTO level for controller use.
export type { ProductToggleFlag };
