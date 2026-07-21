import { z } from 'zod';

const uuid = z.string().uuid('Must be a valid UUID');

export const userIdParamsSchema = z.object({ userId: uuid });
export const wishlistItemParamsSchema = z.object({ userId: uuid, productId: uuid });

export const addWishlistItemSchema = z.object({
  productId: uuid,
});
