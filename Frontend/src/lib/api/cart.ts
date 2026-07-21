import { apiRequest } from "./client";
import type { CartDto } from "./types";

/**
 * Cart is server-backed and requires a signed-in user — the backend has no
 * guest cart (Cart is 1:1 with a user account). Every call here needs the
 * current user's id; callers should gate on `useAuth().isAuthenticated`.
 */

export async function getCart(userId: string) {
  return apiRequest<CartDto>(`/cart/${userId}`);
}

export async function addCartItem(userId: string, variantId: string, quantity = 1) {
  return apiRequest<CartDto>(`/cart/${userId}/items`, {
    method: "POST",
    body: JSON.stringify({ variantId, quantity }),
  });
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  return apiRequest<CartDto>(`/cart/${userId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  return apiRequest<CartDto>(`/cart/${userId}/items/${itemId}`, { method: "DELETE" });
}

export async function clearCart(userId: string) {
  return apiRequest<CartDto>(`/cart/${userId}`, { method: "DELETE" });
}
