import { Request, Response } from 'express';

import { success } from '../../../utils/response';
import { ForbiddenError } from '../../../utils/errors';

import * as cartService from '../service';
import { CART_MESSAGES } from '../constants';

const enforceCartOwnership = (req: Request): void => {
  if (req.user?.id !== req.params.userId) {
    throw new ForbiddenError('You can only access your own cart.');
  }
};

export const getCartController = async (req: Request, res: Response): Promise<void> => {
  enforceCartOwnership(req);
  const cart = await cartService.getCart(req.params.userId);
  success(res, cart, CART_MESSAGES.RETRIEVED);
};

export const addCartItemController = async (req: Request, res: Response): Promise<void> => {
  enforceCartOwnership(req);
  const cart = await cartService.addItem(req.params.userId, req.body);
  success(res, cart, CART_MESSAGES.ITEM_ADDED);
};

export const updateCartItemController = async (req: Request, res: Response): Promise<void> => {
  enforceCartOwnership(req);
  const cart = await cartService.updateItem(req.params.userId, req.params.itemId, req.body);
  success(res, cart, CART_MESSAGES.ITEM_UPDATED);
};

export const removeCartItemController = async (req: Request, res: Response): Promise<void> => {
  enforceCartOwnership(req);
  const cart = await cartService.removeItem(req.params.userId, req.params.itemId);
  success(res, cart, CART_MESSAGES.ITEM_REMOVED);
};

export const clearCartController = async (req: Request, res: Response): Promise<void> => {
  enforceCartOwnership(req);
  const cart = await cartService.clearCart(req.params.userId);
  success(res, cart, CART_MESSAGES.CLEARED);
};
