import { apiRequest } from "./client";
import type { ReviewDto, ReviewStatus, ReviewSummaryDto } from "./types";

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  productId?: string;
  userId?: string;
  status?: ReviewStatus;
  rating?: number;
  sortBy?: "createdAt" | "updatedAt" | "rating";
  sortOrder?: "asc" | "desc";
}

export async function listReviews(params: ListReviewsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.productId) q.set("productId", params.productId);
  if (params.userId) q.set("userId", params.userId);
  if (params.status) q.set("status", params.status);
  if (params.rating !== undefined) q.set("rating", String(params.rating));
  q.set("sortBy", params.sortBy ?? "createdAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  // Listing is technically a public route, but admin needs every status —
  // send the bearer token so moderation-only statuses aren't filtered out.
  return apiRequest<ReviewDto[]>(`/reviews${qs ? `?${qs}` : ""}`);
}

export async function getReview(id: string) {
  return apiRequest<ReviewDto>(`/reviews/${id}`);
}

/** Public: average rating + star breakdown for a product (approved reviews only). */
export async function getReviewSummary(productId: string) {
  return apiRequest<ReviewSummaryDto>(`/reviews/summary/${productId}`);
}

/** Customer: create a review for a product they have a delivered order for. */
export async function createReview(input: CreateReviewInput) {
  return apiRequest<ReviewDto>("/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteReview(id: string) {
  await apiRequest<null>(`/reviews/${id}`, { method: "DELETE" });
}

export async function approveReview(id: string) {
  return apiRequest<ReviewDto>(`/reviews/${id}/approve`, { method: "PATCH" });
}

export async function rejectReview(id: string) {
  return apiRequest<ReviewDto>(`/reviews/${id}/reject`, { method: "PATCH" });
}

export async function hideReview(id: string) {
  return apiRequest<ReviewDto>(`/reviews/${id}/hide`, { method: "PATCH" });
}

/** Restores a rejected/hidden review — always lands back in APPROVED per the backend. */
export async function restoreReview(id: string) {
  return apiRequest<ReviewDto>(`/reviews/${id}/restore`, { method: "PATCH" });
}

export async function replyToReview(id: string, reply: string) {
  return apiRequest<ReviewDto>(`/reviews/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ reply }),
  });
}

export interface RatedProduct {
  productId: string;
  productName: string;
  averageRating: number;
  reviewCount: number;
}

export interface ReviewAnalytics {
  totalReviews: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageRating: number;
  recentReviews: (ReviewDto & { productName: string })[];
  topRated: RatedProduct[];
  lowestRated: RatedProduct[];
}

/** Admin-only dashboard aggregate — GET /reviews/analytics. */
export async function getReviewAnalytics() {
  return apiRequest<ReviewAnalytics>("/reviews/analytics");
}
