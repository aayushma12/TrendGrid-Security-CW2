export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productThumbnail?: string;
  basePrice: number;
  discountPrice?: number;
  currency: string;
  isActive: boolean;
  inStock: boolean;
  addedAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}
