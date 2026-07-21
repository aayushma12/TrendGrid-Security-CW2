export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  parentCategoryId?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithRelations extends Category {
  parent?: Pick<Category, 'id' | 'name'> | null;
  childrenCount?: number;
}
