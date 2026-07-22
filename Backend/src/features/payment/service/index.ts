/**
 * eSewa (Nepal) payment gateway integration — sandbox/UAT by default via
 * eSewa's own publicly documented test merchant (EPAYTEST), configurable to
 * production credentials through env vars (see config/env.ts).
 *
 * Flow:
 *   1. initiateEsewaPayment — order must already exist (created at checkout
 *      with paymentMethod=ESEWA, paymentStatus=PENDING). Creates a
 *      PaymentTransaction row and returns signed form fields for the
 *      frontend to auto-submit to eSewa.
 *   2. handleEsewaSuccess — eSewa redirects the browser back here with a
 *      base64 `data` query param. We verify its signature, then
 *      independently re-confirm with eSewa's status-check API (never trust
 *      the redirect alone — it's client-controlled), then mark the order
 *      PAID and the transaction VERIFIED.
 *   3. handleEsewaFailure — eSewa redirects here on cancel/failure. Order
 *      stays PENDING; the transaction is marked FAILED.
 */
import crypto from 'crypto';

import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../utils/errors';
import { round2 } from '../../../utils/money';
import * as orderRepo from '../../order/repository';
import * as paymentRepo from '../repository';
import { recordAuditLog } from '../../audit/service';
import { AUDIT_ACTIONS } from '../../audit/constants';
import type { EsewaCallbackPayload, EsewaFormFieldsResponseDto, VerifyEsewaResultDto } from '../dto';
import { ESEWA_SIGNED_FIELD_NAMES, PAYMENT_MESSAGES } from '../constants';

export type ReqUser = { id: string; role: string };

const sign = (message: string): string =>
  crypto.createHmac('sha256', env.esewa.secretKey).update(message).digest('base64');

const buildSignedMessage = (totalAmount: string, transactionUuid: string, productCode: string): string =>
  `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

// -------- initiate --------

export const initiateEsewaPayment = async (
  orderId: string, reqUser: ReqUser,
): Promise<EsewaFormFieldsResponseDto> => {
  const order = await orderRepo.findById(orderId);
  if (!order || order.isDeleted) throw new NotFoundError(PAYMENT_MESSAGES.ORDER_NOT_FOUND);
  if (reqUser.role !== 'ADMIN' && order.userId !== reqUser.id) {
    throw new ForbiddenError('You can only pay for your own orders.');
  }
  if (order.paymentMethod !== 'ESEWA') throw new BadRequestError(PAYMENT_MESSAGES.NOT_ESEWA_ORDER);
  if (order.paymentStatus === 'PAID') throw new BadRequestError(PAYMENT_MESSAGES.ALREADY_PAID);

  const transactionUuid = `${order.orderNumber}-${Date.now()}`;
  const productAmount = round2(order.grandTotal - order.taxAmount - order.shippingCharge);
  const totalAmount = order.grandTotal;

  await paymentRepo.createTransaction({
    orderId: order.id,
    gateway: 'ESEWA',
    referenceId: transactionUuid,
    amount: totalAmount,
  });

  const totalAmountStr = totalAmount.toFixed(2);
  const signature = sign(buildSignedMessage(totalAmountStr, transactionUuid, env.esewa.merchantCode));

  logger.info(`eSewa payment initiated orderId=${order.id} transactionUuid=${transactionUuid} amount=${totalAmountStr}`);

  return {
    paymentUrl: env.esewa.paymentUrl,
    fields: {
      amount: productAmount.toFixed(2),
      tax_amount: order.taxAmount.toFixed(2),
      total_amount: totalAmountStr,
      transaction_uuid: transactionUuid,
      product_code: env.esewa.merchantCode,
      product_service_charge: '0.00',
      product_delivery_charge: order.shippingCharge.toFixed(2),
      success_url: `${env.apiBaseUrl}${env.apiPrefix}/payment/esewa/success`,
      failure_url: `${env.apiBaseUrl}${env.apiPrefix}/payment/esewa/failure`,
      signed_field_names: ESEWA_SIGNED_FIELD_NAMES,
      signature,
    },
  };
};

// -------- success callback --------

const decodeCallback = (data: string): EsewaCallbackPayload => {
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
  } catch {
    throw new BadRequestError(PAYMENT_MESSAGES.VERIFICATION_FAILED);
  }
};

const verifySignature = (payload: EsewaCallbackPayload): boolean => {
  const fieldNames = payload.signed_field_names.split(',');
  const message = fieldNames
    .map((field) => `${field}=${(payload as unknown as Record<string, string>)[field]}`)
    .join(',');
  const expected = sign(message);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(payload.signature);
  // timingSafeEqual throws on mismatched buffer lengths rather than
  // returning false, so a forged/truncated signature must be checked first.
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
};

/** Independently re-confirms the transaction with eSewa's own status API — the
 *  redirect payload alone is client-controlled and never sufficient on its own. */
const confirmWithEsewa = async (transactionUuid: string, totalAmount: string): Promise<{ status: string; refId: string | null }> => {
  const url = new URL(env.esewa.statusCheckUrl);
  url.searchParams.set('product_code', env.esewa.merchantCode);
  url.searchParams.set('total_amount', totalAmount);
  url.searchParams.set('transaction_uuid', transactionUuid);

  const gatewayResponse = await fetch(url.toString());
  if (!gatewayResponse.ok) throw new BadRequestError(PAYMENT_MESSAGES.STATUS_CHECK_FAILED);
  const body = (await gatewayResponse.json()) as { status?: string; ref_id?: string };
  return { status: body.status ?? 'NOT_FOUND', refId: body.ref_id ?? null };
};

export const handleEsewaSuccess = async (data: string): Promise<VerifyEsewaResultDto> => {
  const payload = decodeCallback(data);

  if (!verifySignature(payload)) {
    logger.warn(`eSewa signature mismatch transactionUuid=${payload.transaction_uuid}`);
    throw new BadRequestError(PAYMENT_MESSAGES.SIGNATURE_MISMATCH);
  }

  const txn = await paymentRepo.findByReferenceId(payload.transaction_uuid);
  if (!txn) throw new NotFoundError(PAYMENT_MESSAGES.TRANSACTION_NOT_FOUND);

  const confirmed = await confirmWithEsewa(payload.transaction_uuid, payload.total_amount);
  const isComplete = confirmed.status === 'COMPLETE';

  await paymentRepo.markVerified(payload.transaction_uuid, {
    status: isComplete ? 'PAID' : 'FAILED',
    gatewayRefId: confirmed.refId ?? payload.transaction_code,
    gatewayResponse: payload as unknown as Record<string, string>,
  });

  const order = await orderRepo.findById(txn.orderId);
  if (!order) throw new NotFoundError(PAYMENT_MESSAGES.ORDER_NOT_FOUND);

  if (isComplete && order.paymentStatus !== 'PAID') {
    await orderRepo.updateWithHistory(
      order.id,
      { paymentStatus: 'PAID', paidAt: new Date(), ...(order.status === 'PENDING' ? { status: 'CONFIRMED', confirmedAt: new Date() } : {}) },
      {
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        updatedBy: 'SYSTEM',
        note: `eSewa payment verified (ref: ${confirmed.refId ?? payload.transaction_code})`,
      },
    );
  }

  logger.info(`eSewa payment ${isComplete ? 'verified' : 'NOT confirmed'} orderId=${order.id} transactionUuid=${payload.transaction_uuid} status=${confirmed.status}`);

  void recordAuditLog({
    userId: order.userId,
    action: isComplete ? AUDIT_ACTIONS.PAYMENT_COMPLETED : AUDIT_ACTIONS.PAYMENT_FAILED,
    status: isComplete ? 'SUCCESS' : 'FAILURE',
    metadata: { orderId: order.id, amount: order.grandTotal, transactionUuid: payload.transaction_uuid },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: isComplete ? 'PAID' : order.paymentStatus,
    transactionCode: confirmed.refId ?? payload.transaction_code ?? null,
  };
};

// -------- failure callback --------

export const handleEsewaFailure = async (data?: string): Promise<{ orderId: string | null }> => {
  if (!data) return { orderId: null };
  let payload: EsewaCallbackPayload;
  try {
    payload = decodeCallback(data);
  } catch {
    return { orderId: null };
  }

  const txn = await paymentRepo.findByReferenceId(payload.transaction_uuid);
  if (!txn) return { orderId: null };

  await paymentRepo.markVerified(payload.transaction_uuid, {
    status: 'FAILED',
    gatewayResponse: payload as unknown as Record<string, string>,
  });

  // Reflect the failure on the order itself (not just the transaction row) so
  // the customer sees a "payment failed, retry" state rather than the order
  // silently sitting at PENDING forever. Order.status is left untouched —
  // paymentMethod ESEWA orders stay retryable (initiateEsewaPayment only
  // blocks a NEW attempt once paymentStatus is already PAID).
  const order = await orderRepo.findById(txn.orderId);
  if (order && order.paymentStatus !== 'PAID') {
    await orderRepo.updateWithHistory(
      order.id,
      { paymentStatus: 'FAILED', failedAt: new Date() },
      { status: order.status, updatedBy: 'SYSTEM', note: `eSewa payment failed/cancelled (transaction ${payload.transaction_uuid})` },
    );
  }

  void recordAuditLog({
    userId: order?.userId,
    action: AUDIT_ACTIONS.PAYMENT_FAILED,
    status: 'FAILURE',
    metadata: { orderId: txn.orderId, transactionUuid: payload.transaction_uuid },
  });

  logger.info(`eSewa payment failed/cancelled orderId=${txn.orderId} transactionUuid=${payload.transaction_uuid}`);
  return { orderId: txn.orderId };
};
