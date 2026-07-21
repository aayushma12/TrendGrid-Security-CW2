import { Request, Response } from 'express';

import { noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';

import * as orderService from '../service';
import { buildInvoicePdf } from '../service/invoice';
import { ORDER_FILTER_FIELDS, ORDER_MESSAGES, ORDER_SORT_FIELDS } from '../constants';

export const getOrderController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  success(res, order, ORDER_MESSAGES.RETRIEVED);
};

export const getOrdersController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...ORDER_SORT_FIELDS],
    allowedFilters: [...ORDER_FILTER_FIELDS],
  });
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const { items, meta } = await orderService.getOrders({ ...options, from, to });
  paginated(res, items, meta, ORDER_MESSAGES.LISTED);
};

export const getMyOrdersController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...ORDER_SORT_FIELDS],
    allowedFilters: [...ORDER_FILTER_FIELDS],
  });
  options.filters.userId = req.user!.id;

  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const { items, meta } = await orderService.getOrders({ ...options, from, to });
  paginated(res, items, meta, ORDER_MESSAGES.LISTED);
};

export const updateOrderStatusController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body, req.user);
  success(res, order, ORDER_MESSAGES.STATUS_UPDATED);
};

export const refundOrderController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.refundOrder(req.params.id, req.body, req.user);
  success(res, order, ORDER_MESSAGES.REFUNDED);
};

export const trackOrderController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.trackOrder(req.params.identifier, req.user);
  success(res, order, ORDER_MESSAGES.TRACKED);
};

export const updatePaymentStatusController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.updatePaymentStatus(req.params.id, req.body, req.user);
  success(res, order, ORDER_MESSAGES.PAYMENT_UPDATED);
};

export const cancelOrderController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.cancelOrder(req.params.id, req.body, req.user);
  success(res, order, ORDER_MESSAGES.CANCELLED);
};

export const updateOrderController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.updateOrder(req.params.id, req.body);
  success(res, order, ORDER_MESSAGES.UPDATED);
};

export const deleteOrderController = async (req: Request, res: Response): Promise<void> => {
  await orderService.deleteOrder(req.params.id);
  noContent(res);
};

export const restoreOrderController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.restoreOrder(req.params.id);
  success(res, order, ORDER_MESSAGES.RESTORED);
};

/**
 * Streams a generated PDF invoice for the order. Ownership is enforced the
 * same way as getOrderController (own order, or ADMIN) via getOrderById.
 * Generated fresh from the immutable order snapshot every time — nothing
 * is cached or emailed, just returned as a download.
 */
export const getOrderInvoiceController = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  const pdf = await buildInvoicePdf(order);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.invoiceNumber}.pdf"`);
  res.send(pdf);
};
