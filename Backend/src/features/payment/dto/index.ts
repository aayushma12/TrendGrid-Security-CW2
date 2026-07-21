export interface InitiateEsewaDto {
  orderId: string;
}

export interface EsewaFormFieldsResponseDto {
  paymentUrl: string;
  fields: {
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
  };
}

/** Decoded shape of the base64 `data` query param eSewa redirects back with. */
export interface EsewaCallbackPayload {
  transaction_code: string;
  status: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

export interface VerifyEsewaResultDto {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  transactionCode: string | null;
}
