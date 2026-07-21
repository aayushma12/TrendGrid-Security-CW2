import { Request, Response } from 'express';

import { created, noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';

import * as couponService from '../service';
import { COUPON_FILTER_FIELDS, COUPON_MESSAGES, COUPON_SORT_FIELDS } from '../constants';

export const createCouponController = async (req: Request, res: Response): Promise<void> => {
  const c = await couponService.createCoupon(req.body);
  created(res, c, COUPON_MESSAGES.CREATED);
};

export const getCouponController = async (req: Request, res: Response): Promise<void> => {
  const c = await couponService.getCouponById(req.params.id);
  success(res, c, COUPON_MESSAGES.RETRIEVED);
};

export const getCouponsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...COUPON_SORT_FIELDS],
    allowedFilters: [...COUPON_FILTER_FIELDS],
  });
  const { items, meta } = await couponService.getCoupons(options);
  paginated(res, items, meta, COUPON_MESSAGES.LISTED);
};

export const updateCouponController = async (req: Request, res: Response): Promise<void> => {
  const c = await couponService.updateCoupon(req.params.id, req.body);
  success(res, c, COUPON_MESSAGES.UPDATED);
};

export const deleteCouponController = async (req: Request, res: Response): Promise<void> => {
  await couponService.deleteCoupon(req.params.id);
  noContent(res);
};

export const validateCouponController = async (req: Request, res: Response): Promise<void> => {
  const code = String(req.query.code);
  const cartTotal = Number(req.query.cartTotal);
  const result = await couponService.validateCouponPublic(code, cartTotal);
  success(res, result, COUPON_MESSAGES.VALIDATED);
};

export const validateCouponPostController = async (req: Request, res: Response): Promise<void> => {
  const { code, cartTotal } = req.body;
  const result = await couponService.validateCouponPublic(code, cartTotal);
  success(res, result, COUPON_MESSAGES.VALIDATED);
};
