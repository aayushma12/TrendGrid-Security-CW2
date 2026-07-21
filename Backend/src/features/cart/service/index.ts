/**
 * Cart service — persistent per-user cart.
 *
 * Enforces:
 *   • variant exists
 *   • product + variant are active
 *   • quantity <= available stock (deleted/inactive/out-of-stock are rejected)
 *   • unit price snapshot reflects any currently-valid product discount
 *   • line total = (unit price after discount) × quantity
 */
import { NotFoundError, BadRequestError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { effectiveUnitPrice, round2 } from '../../../utils/money';

import * as cartRepo from '../repository';
import { AddCartItemDto, CartResponseDto, UpdateCartItemDto, toCartResponseDto } from '../dto';
import { CART_MESSAGES } from '../constants';
import { Cart, CartItem } from '../types';

/**
 * Overlay the currently-valid discount for each product onto the raw cart
 * items so `unitPrice`, `discountAmount`, and `lineTotal` reflect the price
 * a customer would pay right now.
 */
const applyDiscountsAndTotals = async (cart: Cart): Promise<Cart> => {
  const items: CartItem[] = [];
  let subtotal = 0;
  let discountTotal = 0;

  for (const item of cart.items) {
    const unit = effectiveUnitPrice(item.originalPrice, item.discountedPrice);
    const discount = round2(item.originalPrice - unit);
    const line = round2(unit * item.quantity);

    subtotal = round2(subtotal + line);
    discountTotal = round2(discountTotal + round2(discount * item.quantity));

    items.push({ ...item, unitPrice: unit, discountAmount: discount, lineTotal: line });
  }

  return { ...cart, items, subtotal, discountTotal };
};

export const getCart = async (userId: string): Promise<CartResponseDto> => {
  const raw = await cartRepo.getOrCreate(userId);
  const cart = await applyDiscountsAndTotals(raw);
  return toCartResponseDto(cart);
};

const validateVariantForCart = async (variantId: string, quantity: number): Promise<void> => {
  const v = await cartRepo.findVariant(variantId);
  if (!v) throw new NotFoundError(CART_MESSAGES.VARIANT_NOT_FOUND);
  if (!v.product.isActive) throw new BadRequestError(CART_MESSAGES.INACTIVE_PRODUCT);
  if (!v.isActive) throw new BadRequestError(CART_MESSAGES.INACTIVE_VARIANT);
  if (v.stock < quantity) throw new BadRequestError(CART_MESSAGES.INSUFFICIENT_STOCK);
};

export const addItem = async (userId: string, dto: AddCartItemDto): Promise<CartResponseDto> => {
  await validateVariantForCart(dto.variantId, dto.quantity);
  const cart = await cartRepo.getOrCreate(userId);

  // Merge quantities: upsert increments; we re-check stock against the new total.
  const currentQuantity =
    cart.items.find((i) => i.variantId === dto.variantId)?.quantity ?? 0;
  await validateVariantForCart(dto.variantId, currentQuantity + dto.quantity);

  await cartRepo.upsertItem(cart.id, dto.variantId, dto.quantity);
  logger.info(`Cart item added userId=${userId} variantId=${dto.variantId} qty=${dto.quantity}`);
  return getCart(userId);
};

export const updateItem = async (
  userId: string, itemId: string, dto: UpdateCartItemDto,
): Promise<CartResponseDto> => {
  const item = await cartRepo.findItem(userId, itemId);
  if (!item) throw new NotFoundError(CART_MESSAGES.ITEM_NOT_FOUND);

  await validateVariantForCart(item.variantId, dto.quantity);
  await cartRepo.updateItemQuantity(itemId, dto.quantity);
  logger.info(`Cart item updated userId=${userId} itemId=${itemId} qty=${dto.quantity}`);
  return getCart(userId);
};

export const removeItem = async (userId: string, itemId: string): Promise<CartResponseDto> => {
  const item = await cartRepo.findItem(userId, itemId);
  if (!item) throw new NotFoundError(CART_MESSAGES.ITEM_NOT_FOUND);
  await cartRepo.removeItem(itemId);
  logger.info(`Cart item removed userId=${userId} itemId=${itemId}`);
  return getCart(userId);
};

export const clearCart = async (userId: string): Promise<CartResponseDto> => {
  await cartRepo.clearCart(userId);
  logger.info(`Cart cleared userId=${userId}`);
  return getCart(userId);
};
