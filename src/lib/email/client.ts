import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("ელფოსტის სერვისი დროებით მიუწვდომელია");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export const emailConfig = {
  from: process.env.EMAIL_FROM ?? "GEO AI Academy <onboarding@resend.dev>",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
} as const;
