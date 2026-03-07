import { siteConfig } from "@/lib/constants";
import { emailLayout, emailButton } from "./layout";

export function purchaseConfirmationHtml(
  name: string,
  courseName: string,
  price: string
): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
      შეძენა წარმატებით დასრულდა! ✅
    </h1>
    <p style="margin:0 0 16px;">
      გამარჯობა, <strong>${name}</strong>! თქვენ წარმატებით შეიძინეთ კურსი.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:rgba(255,255,255,0.03);border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:12px;color:#888888;">კურსი</span><br />
          <span style="font-size:15px;font-weight:600;color:#ffffff;">${courseName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:12px;color:#888888;">გადახდილი თანხა</span><br />
          <span style="font-size:15px;font-weight:600;color:#ffffff;">${price} ₾</span>
        </td>
      </tr>
    </table>
    ${emailButton(`${siteConfig.url}/my-courses`, "სწავლის დაწყება")}
    <p style="margin:0;color:#888888;font-size:13px;">
      კურსი უკვე ხელმისაწვდომია თქვენს პირად პანელში.
    </p>
  `;

  return emailLayout(content);
}

export const purchaseConfirmationSubject =
  "კურსის შეძენა წარმატებით დასრულდა";
