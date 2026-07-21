import { apiRequest } from "./client";

export interface EsewaFormFields {
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
}

export interface InitiateEsewaResult {
  paymentUrl: string;
  fields: EsewaFormFields;
}

/** Creates a payment transaction for an ESEWA order and returns the signed
 *  form fields the browser must POST to eSewa to complete the payment. */
export async function initiateEsewaPayment(orderId: string) {
  return apiRequest<InitiateEsewaResult>("/payment/esewa/initiate", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

/** Builds and submits a hidden form to eSewa — this is how eSewa's v2 form
 *  API works: it expects a real HTML form POST, not a fetch/XHR request, so
 *  the browser can navigate to eSewa's hosted payment page. */
export function redirectToEsewa(result: InitiateEsewaResult): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = result.paymentUrl;

  for (const [key, value] of Object.entries(result.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
