const brandPrimary = "#6C5CE7";
const brandBackground = "#0a0a0a";
const brandSurface = "#111111";
const brandBorder = "#1a1a1a";
const brandText = "#e0e0e0";
const brandMuted = "#888888";

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:${brandBackground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brandBackground};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${brandSurface};border:1px solid ${brandBorder};border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid ${brandBorder};text-align:center;">
              <span style="font-size:20px;font-weight:700;color:${brandText};letter-spacing:-0.02em;">GEO AI Academy</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;color:${brandText};font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${brandBorder};text-align:center;">
              <p style="margin:0;font-size:12px;color:${brandMuted};line-height:1.6;">
                © ${new Date().getFullYear()} GEO AI Academy. ყველა უფლება დაცულია.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:${brandMuted};">
                თუ არ გსურთ ემაილების მიღება, გთხოვთ დაგვიკავშირდეთ.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${brandPrimary};border-radius:10px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}
