import { NextResponse } from "next/server";
import { z } from "zod/v4";

export type ApiFieldErrors = Record<string, string>;

const API_ERROR_MESSAGES = {
  400: "მოთხოვნა არასწორია",
  401: "ავტორიზაცია საჭიროა",
  403: "წვდომა შეზღუდულია",
  404: "მონაცემი ვერ მოიძებნა",
  409: "მოქმედება უკვე შესრულებულია",
  422: "მონაცემები არასწორია",
  429: "ძალიან ბევრი მოთხოვნა. გთხოვთ მოიცადოთ",
  500: "დროებითი შეფერხება. გთხოვთ სცადოთ მოგვიანებით",
} as const;

type ApiStatusCode = keyof typeof API_ERROR_MESSAGES;

function isApiStatusCode(value: number): value is ApiStatusCode {
  return value in API_ERROR_MESSAGES;
}

export function getApiErrorMessage(statusCode: number) {
  return isApiStatusCode(statusCode)
    ? API_ERROR_MESSAGES[statusCode]
    : API_ERROR_MESSAGES[500];
}

export class ApiError extends Error {
  statusCode: number;
  userMessage: string;
  fieldErrors?: ApiFieldErrors;

  constructor(
    statusCode: number,
    userMessage: string = getApiErrorMessage(statusCode),
    fieldErrors?: ApiFieldErrors
  ) {
    super(userMessage);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.fieldErrors = fieldErrors;
  }
}

export function getSafeZodFieldErrors(error: z.ZodError): ApiFieldErrors {
  const fieldErrors: ApiFieldErrors = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "root");

    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function createApiErrorResponse(
  statusCode: number,
  fieldErrors?: ApiFieldErrors,
  userMessage?: string
) {
  return NextResponse.json(
    {
      error: userMessage ?? getApiErrorMessage(statusCode),
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    { status: statusCode }
  );
}

export function badRequestResponse() {
  return createApiErrorResponse(400);
}

export function unauthorizedResponse() {
  return createApiErrorResponse(401);
}

export function forbiddenResponse() {
  return createApiErrorResponse(403);
}

export function notFoundResponse() {
  return createApiErrorResponse(404);
}

export function conflictResponse() {
  return createApiErrorResponse(409);
}

export function validationErrorResponse(fieldErrors: ApiFieldErrors) {
  return createApiErrorResponse(422, fieldErrors);
}

export function rateLimitResponse() {
  return createApiErrorResponse(429);
}

export function serverErrorResponse() {
  return createApiErrorResponse(500);
}

export async function parseJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ApiError(400);
  }
}

export function handleApiError(error: unknown, context?: string) {
  console.error(context ?? "[API] Request failed", error);

  if (error instanceof ApiError) {
    return createApiErrorResponse(
      error.statusCode,
      error.fieldErrors,
      error.userMessage
    );
  }

  if (error instanceof z.ZodError) {
    return validationErrorResponse(getSafeZodFieldErrors(error));
  }

  return serverErrorResponse();
}
