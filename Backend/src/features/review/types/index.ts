import type { ReviewStatusValue } from '../constants';

export interface ReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
  imagePublicId: string;
  position: number;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatusValue;
  adminReply?: string;
  adminRepliedAt?: Date;
  images: ReviewImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
}
