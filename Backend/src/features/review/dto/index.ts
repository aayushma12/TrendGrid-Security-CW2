import type { ReviewStatusValue } from '../constants';
import type { Review, ReviewImage, ReviewSummary } from '../types';

export interface CreateReviewDto {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  title?: string | null;
  comment?: string | null;
}

export interface AdminReplyDto {
  reply: string;
}

export interface ReviewImageResponseDto {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  position: number;
}

export interface ReviewResponseDto {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatusValue;
  adminReply: string | null;
  adminRepliedAt: string | null;
  images: ReviewImageResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummaryResponseDto {
  productId: string;
  averageRating: number;
  totalReviews: number;
  breakdown: { '1': number; '2': number; '3': number; '4': number; '5': number };
}

const toImageDto = (i: ReviewImage): ReviewImageResponseDto => ({
  id: i.id, imageUrl: i.imageUrl, imagePublicId: i.imagePublicId, position: i.position,
});

export const toReviewResponseDto = (r: Review): ReviewResponseDto => ({
  id: r.id,
  productId: r.productId,
  userId: r.userId,
  orderId: r.orderId ?? null,
  rating: r.rating,
  title: r.title ?? null,
  comment: r.comment ?? null,
  status: r.status,
  adminReply: r.adminReply ?? null,
  adminRepliedAt: r.adminRepliedAt?.toISOString() ?? null,
  images: r.images.map(toImageDto),
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export const toReviewSummaryResponseDto = (s: ReviewSummary): ReviewSummaryResponseDto => ({
  productId: s.productId,
  averageRating: s.averageRating,
  totalReviews: s.totalReviews,
  breakdown: {
    '1': s.breakdown[1],
    '2': s.breakdown[2],
    '3': s.breakdown[3],
    '4': s.breakdown[4],
    '5': s.breakdown[5],
  },
});

export interface RatedProductDto {
  productId: string;
  productName: string;
  averageRating: number;
  reviewCount: number;
}

export interface ReviewAnalyticsResponseDto {
  totalReviews: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageRating: number;
  recentReviews: (ReviewResponseDto & { productName: string })[];
  topRated: RatedProductDto[];
  lowestRated: RatedProductDto[];
}
