import { emailLayout } from "./layout";

export function contactNotificationHtml(
  senderName: string,
  senderEmail: string,
  message: string
): string {
  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
      ახალი შეტყობინება კონტაქტის ფორმიდან
    </h1>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:rgba(255,255,255,0.03);border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">გამგზავნი</span><br />
          <span style="font-size:15px;font-weight:600;color:#ffffff;">${senderName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">ელფოსტა</span><br />
          <a href="mailto:${senderEmail}" style="font-size:15px;color:#6C5CE7;text-decoration:none;">${senderEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:12px;color:#888888;">შეტყობინება</span><br />
          <p style="margin:8px 0 0;font-size:15px;color:#e0e0e0;line-height:1.7;">${escapedMessage}</p>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(content);
}

export const contactNotificationSubject =
  "ახალი შეტყობინება კონტაქტის ფორმიდან";
