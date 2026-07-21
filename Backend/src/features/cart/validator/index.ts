import { z } from 'zod';

import { MAX_LINE_QUANTITY } from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');

export const userIdParamsSchema = z.object({ userId: uuid });
export const cartItemIdParamsSchema = z.object({ userId: uuid, itemId: uuid });

export const addCartItemSchema = z.object({
  variantId: uuid,
  quantity: z.coerce.number().int().positive().max(MAX_LINE_QUANTITY),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive().max(MAX_LINE_QUANTITY),
});
