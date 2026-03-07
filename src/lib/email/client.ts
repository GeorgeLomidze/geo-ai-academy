import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const emailConfig = {
  from: process.env.EMAIL_FROM ?? "GEO AI Academy <onboarding@resend.dev>",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
} as const;
