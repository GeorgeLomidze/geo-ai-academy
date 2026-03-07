import { resend, emailConfig } from "./client";
import {
  welcomeEmailHtml,
  welcomeEmailSubject,
} from "./templates/welcome";
import {
  purchaseConfirmationHtml,
  purchaseConfirmationSubject,
} from "./templates/purchase-confirmation";
import {
  contactNotificationHtml,
  contactNotificationSubject,
} from "./templates/contact-notification";

export async function sendWelcomeEmail(email: string, name: string) {
  const { error } = await resend.emails.send({
    from: emailConfig.from,
    to: email,
    subject: welcomeEmailSubject,
    html: welcomeEmailHtml(name),
  });

  if (error) {
    console.error("[Email] Failed to send welcome email:", error);
  }
}

export async function sendPurchaseEmail(
  email: string,
  name: string,
  courseName: string,
  price: string
) {
  const { error } = await resend.emails.send({
    from: emailConfig.from,
    to: email,
    subject: purchaseConfirmationSubject,
    html: purchaseConfirmationHtml(name, courseName, price),
  });

  if (error) {
    console.error("[Email] Failed to send purchase email:", error);
  }
}

export async function sendContactNotification(
  senderName: string,
  senderEmail: string,
  message: string
) {
  if (!emailConfig.adminEmail) {
    console.error("[Email] ADMIN_EMAIL not configured");
    return;
  }

  const { error } = await resend.emails.send({
    from: emailConfig.from,
    to: emailConfig.adminEmail,
    subject: contactNotificationSubject,
    html: contactNotificationHtml(senderName, senderEmail, message),
    replyTo: senderEmail,
  });

  if (error) {
    console.error("[Email] Failed to send contact notification:", error);
  }
}

export async function sendBulkEmail(
  emails: string[],
  subject: string,
  htmlContent: string
) {
  if (emails.length === 0) return { successCount: 0, errorCount: 0 };

  // Resend batch API supports up to 100 emails per request
  const batches: string[][] = [];
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(emails.slice(i, i + 100));
  }

  let successCount = 0;
  let errorCount = 0;

  for (const batch of batches) {
    const { error } = await resend.batch.send(
      batch.map((to) => ({
        from: emailConfig.from,
        to,
        subject,
        html: htmlContent,
      }))
    );

    if (error) {
      console.error("[Email] Batch send error:", error);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
    }
  }

  return { successCount, errorCount };
}
