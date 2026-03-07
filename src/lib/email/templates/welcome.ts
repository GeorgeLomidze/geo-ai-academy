import { siteConfig } from "@/lib/constants";
import { emailLayout, emailButton } from "./layout";

export function welcomeEmailHtml(name: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
      მოგესალმებით, ${name}! 👋
    </h1>
    <p style="margin:0 0 12px;">
      მადლობა, რომ შეუერთდით <strong>GEO AI Academy</strong>-ს — პლატფორმას, სადაც AI ტექნოლოგიებს ქართულად ისწავლით.
    </p>
    <p style="margin:0 0 8px;">აი, რა შეგიძლიათ გააკეთოთ:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li style="margin-bottom:6px;">დაათვალიერეთ ჩვენი კურსების კატალოგი</li>
      <li style="margin-bottom:6px;">აირჩიეთ კურსი და დაიწყეთ სწავლა</li>
      <li style="margin-bottom:6px;">თვალი ადევნეთ პროგრესს პირად პანელზე</li>
    </ul>
    ${emailButton(`${siteConfig.url}/courses`, "კურსების ნახვა")}
    <p style="margin:0;color:#888888;font-size:13px;">
      თუ გექნებათ შეკითხვები, ნებისმიერ დროს დაგვიკავშირდით.
    </p>
  `;

  return emailLayout(content);
}

export const welcomeEmailSubject = "მოგესალმებით GEO AI Academy-ში!";
