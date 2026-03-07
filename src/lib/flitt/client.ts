import { createHash } from "crypto";

interface FlittCheckoutParams {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  responseUrl: string;
}

interface FlittCheckoutResponse {
  response: {
    response_status?: string;
    checkout_url?: string;
    payment_id?: string;
    error_message?: string;
    error_code?: number;
  };
}

function buildSignature(
  params: Record<string, string>,
  secretKey: string,
): string {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== "")
    .sort()
    .map((key) => params[key]);

  const signatureString = [secretKey, ...sorted].join("|");

  return createHash("sha1").update(signatureString).digest("hex");
}

export function verifyFlittSignature(
  params: Record<string, string>,
  signature: string,
  secretKey: string,
): boolean {
  const expected = buildSignature(params, secretKey);
  return expected === signature;
}

export async function createCheckoutUrl({
  orderId,
  amount,
  currency,
  description,
  callbackUrl,
  responseUrl,
}: FlittCheckoutParams): Promise<{
  checkoutUrl: string;
  paymentId: string;
}> {
  const merchantId = process.env.FLITT_MERCHANT_ID;
  const secretKey = process.env.FLITT_SECRET_KEY;

  if (!merchantId || !secretKey) {
    throw new Error("Flitt credentials not configured");
  }

  const amountInCoins = String(Math.round(amount * 100));

  const params: Record<string, string> = {
    order_id: orderId,
    merchant_id: merchantId,
    order_desc: description,
    amount: amountInCoins,
    currency,
    server_callback_url: callbackUrl,
    response_url: responseUrl,
  };

  const signature = buildSignature(params, secretKey);

  const res = await fetch("https://pay.flitt.com/api/checkout/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: { ...params, signature } }),
  });

  const data = (await res.json()) as FlittCheckoutResponse;

  if (!res.ok) {
    throw new Error(
      `Flitt API HTTP error: ${res.status} — ${data.response?.error_message ?? "unknown"}`,
    );
  }

  if (data.response?.response_status === "failure" || data.response?.error_message) {
    throw new Error(
      `Flitt API error: ${data.response.error_message ?? "unknown"} (code: ${data.response.error_code ?? "none"})`,
    );
  }

  if (!data.response?.checkout_url) {
    throw new Error(
      `Flitt API returned no checkout_url: ${JSON.stringify(data)}`,
    );
  }

  return {
    checkoutUrl: data.response.checkout_url,
    paymentId: data.response.payment_id ?? "",
  };
}
