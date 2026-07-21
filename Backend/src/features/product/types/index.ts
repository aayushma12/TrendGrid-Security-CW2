import { ProductStatusValue } from '../constants';

export interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  imagePublicId?: string;

  extraImage1Url?: string;
  extraImage1PublicId?: string;
  extraImage2Url?: string;
  extraImage2PublicId?: string;
  extraImage3Url?: string;
  extraImage3PublicId?: string;

  basePrice: number;
  discountPrice?: number;
  currency: string;

  categoryId: string;
  brand?: string;

  status: ProductStatusValue;
  isActive: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;

  sizes: string[];
  colors: { name: string; hexCode: string }[];
  tags: string[];
  labels: string[];
  collections: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCharacteristic {
  id: string;
  productId: string;
  name: string;
  value: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}


export interface ProductVariantImage {
  id: string;
  variantId: string;
  imageUrl: string;
  imagePublicId: string;
  position: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color?: string | null;
  size?: string | null;
  sku: string;
  barcode?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images?: ProductVariantImage[];
}

export interface ProductWithRelations extends Product {
  category?: { id: string; name: string } | null;

  characteristics?: ProductCharacteristic[];

  variants?: ProductVariant[];
  variantsCount?: number;
}
