import type { Request, Response } from 'express';

import { created, success } from '../../../utils/response';
import * as checkoutService from '../service';
import { CHECKOUT_MESSAGES } from '../constants';

export const previewCheckoutController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id; // route is 'authenticated', user is guaranteed
  const summary = await checkoutService.previewCheckout(userId, req.body);
  success(res, summary, CHECKOUT_MESSAGES.PREVIEW_OK);
};

export const placeOrderController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const result = await checkoutService.placeOrder(userId, req.body);
  created(res, result, CHECKOUT_MESSAGES.PLACED);
};
