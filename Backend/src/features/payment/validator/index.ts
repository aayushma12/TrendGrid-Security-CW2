import { z } from 'zod';

export const initiateEsewaSchema = z.object({
  orderId: z.string().uuid(),
});

export const esewaCallbackQuerySchema = z.object({
  data: z.string().min(1),
});
