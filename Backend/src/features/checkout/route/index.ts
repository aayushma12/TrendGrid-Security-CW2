import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';

import { placeOrderController, previewCheckoutController } from '../controller';
import { placeOrderSchema, previewCheckoutSchema } from '../validator';

const router = Router();

// Checkout requires a verified user — userId is read from req.user.id in the controller.
defineRoutes(router, [
  { method: 'post', path: '/preview',     auth: 'authenticated', schema: { body: previewCheckoutSchema }, handler: previewCheckoutController },
  { method: 'post', path: '/place-order', auth: 'authenticated', schema: { body: placeOrderSchema },      handler: placeOrderController },
]);

export default router;
