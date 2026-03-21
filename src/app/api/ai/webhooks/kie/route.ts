import { NextRequest, NextResponse } from "next/server";
import {
  badRequestResponse,
  forbiddenResponse,
  handleApiError,
} from "@/lib/api-error";
import { handleKieCallback, type KieCallbackPayload } from "@/lib/kie/callback";

function verifyKieWebhookRequest(request: NextRequest) {
  const configuredSecret = process.env.KIE_AI_WEBHOOK_SECRET;

  if (!configuredSecret) {
    return true;
  }

  const queryToken = request.nextUrl.searchParams.get("token");
  const headerToken = request.headers.get("x-kie-webhook-secret");

  return queryToken === configuredSecret || headerToken === configuredSecret;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyKieWebhookRequest(request)) {
      return forbiddenResponse();
    }

    let body: KieCallbackPayload;
    try {
      body = (await request.json()) as KieCallbackPayload;
    } catch {
      return badRequestResponse();
    }

    const result = await handleKieCallback(body);

    return NextResponse.json({ status: "ok", result });
  } catch (error) {
    return handleApiError(error, "POST /api/ai/webhooks/kie failed");
  }
}
