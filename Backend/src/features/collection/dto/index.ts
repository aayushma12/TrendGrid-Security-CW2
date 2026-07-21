import type { Collection } from '../types';
import type { ProductResponseDto } from '../../product/dto';
import type { PaginationMeta } from '../../../types';

export interface CreateCollectionDto {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCollectionStatusDto {
  isActive: boolean;
}

export interface CollectionResponseDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const toCollectionResponseDto = (c: Collection): CollectionResponseDto => ({
  id: c.id,
  name: c.name,
  description: c.description ?? null,
  imageUrl: c.imageUrl ?? null,
  imagePublicId: c.imagePublicId ?? null,
  isActive: c.isActive,
  displayOrder: c.displayOrder,
  productCount: c.productCount,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export interface CollectionProductsResponseDto {
  collection: { id: string; name: string };
  products: ProductResponseDto[];
  meta: PaginationMeta;
}
