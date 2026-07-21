import type { Request, Response } from 'express';

import { env } from '../../../config/env';
import { success } from '../../../utils/response';
import { logger } from '../../../utils/logger';
import * as paymentService from '../service';
import { PAYMENT_MESSAGES } from '../constants';

export const initiateEsewaController = async (req: Request, res: Response): Promise<void> => {
  const reqUser = { id: req.user!.id, role: req.user!.role };
  const result = await paymentService.initiateEsewaPayment(req.body.orderId, reqUser);
  success(res, result, PAYMENT_MESSAGES.INITIATED);
};

/** eSewa redirects the customer's browser here after a completed payment. */
export const esewaSuccessController = async (req: Request, res: Response): Promise<void> => {
  const data = req.query.data as string;
  try {
    const result = await paymentService.handleEsewaSuccess(data);
    res.redirect(`${env.frontendUrl}/orders/${result.orderId}?payment=${result.paymentStatus === 'PAID' ? 'success' : 'unconfirmed'}`);
  } catch (err) {
    logger.error(`eSewa success callback failed: ${(err as Error).message}`);
    res.redirect(`${env.frontendUrl}/checkout?payment=error`);
  }
};

/** eSewa redirects the customer's browser here on cancel/failure. */
export const esewaFailureController = async (req: Request, res: Response): Promise<void> => {
  const data = req.query.data as string | undefined;
  const result = await paymentService.handleEsewaFailure(data);
  res.redirect(
    result.orderId
      ? `${env.frontendUrl}/orders/${result.orderId}?payment=failed`
      : `${env.frontendUrl}/checkout?payment=failed`,
  );
};
