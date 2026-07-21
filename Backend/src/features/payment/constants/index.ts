export const PAYMENT_MESSAGES = {
  ORDER_NOT_FOUND: 'Order not found.',
  NOT_ESEWA_ORDER: 'This order was not placed with eSewa as the payment method.',
  ALREADY_PAID: 'This order has already been paid for.',
  INITIATED: 'eSewa payment initiated.',
  VERIFIED: 'Payment verified successfully.',
  VERIFICATION_FAILED: 'Payment could not be verified.',
  SIGNATURE_MISMATCH: 'Payment response signature could not be verified.',
  STATUS_CHECK_FAILED: 'Could not confirm payment status with eSewa.',
  TRANSACTION_NOT_FOUND: 'Payment transaction not found.',
} as const;

/** Fields eSewa v2 requires to be signed, in order, per their spec. */
export const ESEWA_SIGNED_FIELD_NAMES = 'total_amount,transaction_uuid,product_code';
