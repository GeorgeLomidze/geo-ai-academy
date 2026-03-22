import { emailConfig, getResendClient } from "./client";
import { getSignatureHtml, buildSignatureBlock } from "./signature";
import { emailButton, emailLayout } from "./templates/layout";
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
import { logDebug } from "@/lib/logger";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

async function injectSignature(html: string): Promise<string> {
  try {
    const signatureHtml = await getSignatureHtml();
    const block = buildSignatureBlock(signatureHtml);
    if (!block) return html;

    // Insert signature before the footer separator in the email layout
    const footerMarker = "<!-- Footer -->";
    if (html.includes(footerMarker)) {
      return html.replace(footerMarker, `${block}\n${footerMarker}`);
    }

    // Fallback: insert before closing </body>
    if (html.includes("</body>")) {
      return html.replace("</body>", `${block}\n</body>`);
    }

    return html + block;
  } catch {
    return html;
  }
}

async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  const resend = getResendClient();
  const finalHtml = await injectSignature(html);
  const { error } = await resend.emails.send({
    from: emailConfig.from,
    to,
    subject,
    html: finalHtml,
    replyTo,
  });

  if (error) {
    throw error;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await sendEmail({
      to: email,
      subject: welcomeEmailSubject,
      html: welcomeEmailHtml(name),
    });
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
  }
}

export async function sendPurchaseEmail(
  email: string,
  name: string,
  courseName: string,
  price: string
) {
  try {
    await sendEmail({
      to: email,
      subject: purchaseConfirmationSubject,
      html: purchaseConfirmationHtml(name, courseName, price),
    });
  } catch (error) {
    console.error("[Email] Failed to send purchase email:", error);
  }
}

export async function sendContactNotification(
  senderName: string,
  senderEmail: string,
  subjectLine: string,
  message: string
) {
  if (!emailConfig.adminEmail) {
    throw new Error("ADMIN_EMAIL not configured");
  }

  try {
    await sendEmail({
      to: emailConfig.adminEmail,
      subject: `${contactNotificationSubject}: ${subjectLine}`,
      html: contactNotificationHtml(senderName, senderEmail, subjectLine, message),
      replyTo: senderEmail,
    });
  } catch (error) {
    console.error("[Email] Failed to send contact notification:", error);
    throw error;
  }
}

export async function sendAdminNewQuestionEmail({
  studentName,
  courseName,
  lessonName,
  questionPreview,
  adminQaUrl,
}: {
  studentName: string;
  courseName: string;
  lessonName: string;
  questionPreview: string;
  adminQaUrl: string;
}) {
  if (!emailConfig.adminEmail) {
    throw new Error("ADMIN_EMAIL not configured");
  }

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
      ახალი კითხვა სტუდენტისგან
    </h1>
    <p style="margin:0 0 20px;color:#e0e0e0;">
      სტუდენტმა დასვა ახალი კითხვა კითხვა-პასუხის სექციაში.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:rgba(255,255,255,0.03);border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">სტუდენტი</span><br />
          <span style="font-size:15px;font-weight:600;color:#ffffff;">${escapeHtml(studentName)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">კურსი და გაკვეთილი</span><br />
          <span style="font-size:15px;color:#ffffff;">${escapeHtml(courseName)} / ${escapeHtml(lessonName)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:12px;color:#888888;">კითხვის ტექსტი</span><br />
          <p style="margin:8px 0 0;font-size:15px;color:#e0e0e0;line-height:1.7;">${escapeHtml(questionPreview)}</p>
        </td>
      </tr>
    </table>
    ${emailButton(adminQaUrl, "კითხვების ნახვა ადმინ პანელში")}
  `;

  await sendEmail({
    to: emailConfig.adminEmail,
    subject: `ახალი კითხვა: ${courseName} - ${lessonName}`,
    html: emailLayout(content),
  });
}

export async function sendQuestionAnsweredEmail({
  email,
  recipientName,
  answererName,
  answerPreview,
  courseName,
  lessonUrl,
  answeredByAdmin,
}: {
  email: string;
  recipientName?: string | null;
  answererName: string;
  answerPreview: string;
  courseName: string;
  lessonUrl: string;
  answeredByAdmin: boolean;
}) {
  const safeRecipientName = recipientName?.trim() || "მომხმარებელო";
  const subject = answeredByAdmin
    ? "ტრენერმა უპასუხა თქვენს კითხვას"
    : `თქვენს კითხვას უპასუხეს: ${courseName}`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
      ${answeredByAdmin ? "თქვენს კითხვას ტრენერმა უპასუხა" : "თქვენს კითხვაზე ახალი პასუხია"}
    </h1>
    <p style="margin:0 0 20px;color:#e0e0e0;">
      გამარჯობა, ${escapeHtml(safeRecipientName)}.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:rgba(255,255,255,0.03);border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">პასუხის ავტორი</span><br />
          <span style="font-size:15px;font-weight:600;color:#ffffff;">${escapeHtml(answererName)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">კურსი</span><br />
          <span style="font-size:15px;color:#ffffff;">${escapeHtml(courseName)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:12px;color:#888888;">პასუხის მოკლე ტექსტი</span><br />
          <p style="margin:8px 0 0;font-size:15px;color:#e0e0e0;line-height:1.7;">${escapeHtml(answerPreview)}</p>
        </td>
      </tr>
    </table>
    ${emailButton(lessonUrl, "პასუხის ნახვა გაკვეთილში")}
  `;

  await sendEmail({
    to: email,
    subject,
    html: emailLayout(content),
  });
}

export async function sendBulkEmail(
  emails: string[],
  subject: string,
  htmlContent: string
) {
  if (emails.length === 0) return { successCount: 0, errorCount: 0 };

  const finalHtml = await injectSignature(htmlContent);
  let successCount = 0;
  let errorCount = 0;

  for (const email of emails) {
    try {
      const resend = getResendClient();
      const { data, error } = await resend.emails.send({
        from: emailConfig.from,
        to: email,
        subject,
        html: finalHtml,
      });

      if (error) {
        console.error("[Email] Send failed for", email, ":", JSON.stringify(error));
        errorCount++;
      } else {
        logDebug("[Email] Send success", { email, data });
        successCount++;
      }
    } catch (err) {
      console.error("[Email] Exception sending to", email, ":", err);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

export async function sendKieLowBalanceAlert(credits: number) {
  if (!emailConfig.adminEmail) {
    return;
  }

  const usdValue = (credits * 0.005).toFixed(2);

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
      Kie.ai კრედიტები ამოიწურება
    </h1>
    <p style="margin:0 0 20px;color:#e0e0e0;">
      თქვენს Kie.ai ანგარიშზე დარჩა <strong style="color:#ffffff;">${credits.toLocaleString("ka-GE")}</strong> კრედიტი (&asymp; $${usdValue}).
    </p>
    <p style="margin:0 0 24px;color:#e0e0e0;">
      გთხოვთ შეავსოთ ბალანსი, რომ AI გენერაცია შეუფერხებლად გაგრძელდეს.
    </p>
    ${emailButton("https://kie.ai/pricing", "ბალანსის შევსება")}
  `;

  try {
    await sendEmail({
      to: emailConfig.adminEmail,
      subject: "Kie.ai კრედიტები ამოიწურება!",
      html: emailLayout(content),
    });
  } catch (error) {
    console.error("[Email] Failed to send Kie.ai low balance alert:", error);
  }
}
