/**
 * DTOs — the only shapes exposed outside the service.
 * NOTE: image data (URL + publicId) is set exclusively via the dedicated
 * upload endpoint. It is NOT accepted in create/update bodies.
 */
import { Category, CategoryWithRelations } from '../types';
import { ProductResponseDto } from '../../product/dto';
import { PaginationMeta } from '../../../types';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentCategoryId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateCategoryStatusDto {
  isActive: boolean;
}

export interface UpdateCategoryFeatureDto {
  isFeatured: boolean;
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  parentCategoryId: string | null;
  parent?: { id: string; name: string } | null;
  childrenCount?: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  imageUrl: string | null;
  isFeatured: boolean;
  children: CategoryTreeNode[];
}

export const toCategoryResponseDto = (c: CategoryWithRelations | Category): CategoryResponseDto => ({
  id: c.id,
  name: c.name,
  description: c.description ?? null,
  imageUrl: c.imageUrl ?? null,
  imagePublicId: c.imagePublicId ?? null,
  parentCategoryId: c.parentCategoryId ?? null,
  parent: (c as CategoryWithRelations).parent ?? null,
  childrenCount: (c as CategoryWithRelations).childrenCount,
  isFeatured: c.isFeatured,
  isActive: c.isActive,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

// ---- Smart grouped product listing DTOs ----

/** A group of products belonging to one subcategory. */
export interface SubcategoryProductGroup {
  subcategory: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  products: ProductResponseDto[];
  meta: PaginationMeta;
}

/**
 * Response shape for GET /categories/:id/products.
 *
 * - `mode: "grouped"` — the category has subcategories; products are grouped per subcategory.
 * - `mode: "flat"`    — no subcategories; products are returned as a simple paginated list.
 */
export type CategoryProductsResponseDto =
  | {
      mode: 'grouped';
      category: { id: string; name: string };
      groups: SubcategoryProductGroup[];
    }
  | {
      mode: 'flat';
      category: { id: string; name: string };
      products: ProductResponseDto[];
      meta: PaginationMeta;
    };
