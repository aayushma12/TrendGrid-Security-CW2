export interface Collection {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
