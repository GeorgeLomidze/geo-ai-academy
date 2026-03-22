const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "br",
  "div",
  "em",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);
const STRIP_WITH_CONTENT_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "meta",
  "link",
  "base",
  "svg",
  "math",
  "canvas",
  "video",
  "audio",
  "source",
];

const ALLOWED_STYLE_PROPERTIES = new Set([
  "background",
  "background-color",
  "border",
  "border-bottom",
  "border-left",
  "border-radius",
  "border-right",
  "border-top",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "vertical-align",
  "width",
]);

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function isSafeUrl(value: string, kind: "href" | "src") {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    return true;
  }

  if (kind === "src" && trimmed.startsWith("data:image/")) {
    return true;
  }

  if (kind === "src" && trimmed.startsWith("cid:")) {
    return true;
  }

  try {
    const protocol = new URL(trimmed, "https://geo-ai-academy.local").protocol;
    return ["http:", "https:", "mailto:", "tel:"].includes(protocol);
  } catch {
    return false;
  }
}

function sanitizeStyle(styleValue: string) {
  const declarations = styleValue
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const safeDeclarations: string[] = [];

  for (const declaration of declarations) {
    const separatorIndex = declaration.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const value = declaration.slice(separatorIndex + 1).trim();
    const normalizedValue = value.toLowerCase();

    if (!ALLOWED_STYLE_PROPERTIES.has(property)) {
      continue;
    }

    if (
      !value ||
      normalizedValue.includes("expression(") ||
      normalizedValue.includes("javascript:") ||
      normalizedValue.includes("vbscript:") ||
      normalizedValue.includes("behavior:") ||
      normalizedValue.includes("-moz-binding") ||
      normalizedValue.includes("@import") ||
      normalizedValue.includes("<") ||
      normalizedValue.includes(">") ||
      normalizedValue.includes("url(")
    ) {
      continue;
    }

    safeDeclarations.push(`${property}: ${value}`);
  }

  return safeDeclarations.join("; ");
}

function sanitizeNumericAttribute(value: string, max: number) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }

  const numeric = Number.parseInt(digits, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return String(Math.min(numeric, max));
}

function sanitizeAttributes(tagName: string, rawAttributes: string) {
  const safeAttributes: string[] = [];
  const attributePattern =
    /([a-zA-Z0-9:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(rawAttributes)) !== null) {
    const name = match[1].toLowerCase();
    const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();

    if (!name || name.startsWith("on")) {
      continue;
    }

    if (name === "style") {
      const safeStyle = sanitizeStyle(value);
      if (safeStyle) {
        safeAttributes.push(`style="${escapeHtmlAttribute(safeStyle)}"`);
      }
      continue;
    }

    if (name === "href" && tagName === "a" && isSafeUrl(value, "href")) {
      safeAttributes.push(`href="${escapeHtmlAttribute(value)}"`);
      continue;
    }

    if (name === "src" && tagName === "img" && isSafeUrl(value, "src")) {
      safeAttributes.push(`src="${escapeHtmlAttribute(value)}"`);
      continue;
    }

    if (name === "alt" && tagName === "img") {
      safeAttributes.push(`alt="${escapeHtmlAttribute(value)}"`);
      continue;
    }

    if (name === "target" && tagName === "a" && value === "_blank") {
      safeAttributes.push('target="_blank"');
      safeAttributes.push('rel="noopener noreferrer nofollow"');
      continue;
    }

    if (name === "rel" && tagName === "a") {
      continue;
    }

    if (["align", "valign"].includes(name) && value) {
      safeAttributes.push(`${name}="${escapeHtmlAttribute(value)}"`);
      continue;
    }

    if (["width", "height"].includes(name) && tagName === "img") {
      const safeNumeric = sanitizeNumericAttribute(value, 1200);
      if (safeNumeric) {
        safeAttributes.push(`${name}="${safeNumeric}"`);
      }
      continue;
    }

    if (["colspan", "rowspan"].includes(name) && ["td", "th"].includes(tagName)) {
      const safeNumeric = sanitizeNumericAttribute(value, 12);
      if (safeNumeric) {
        safeAttributes.push(`${name}="${safeNumeric}"`);
      }
    }
  }

  if (tagName === "a" && !safeAttributes.some((attr) => attr.startsWith("href="))) {
    return "";
  }

  return safeAttributes.length > 0 ? ` ${safeAttributes.join(" ")}` : "";
}

export function sanitizeEmailSignatureHtml(html: string) {
  if (!html.trim()) {
    return "";
  }

  let sanitized = html.replace(/<!--[\s\S]*?-->/g, "");

  for (const tag of STRIP_WITH_CONTENT_TAGS) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    sanitized = sanitized.replace(pattern, "");
  }

  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, rawTag, rawAttributes) => {
    const tagName = String(rawTag).toLowerCase();
    const isClosing = full.startsWith("</");

    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }

    if (isClosing) {
      return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;
    }

    const safeAttributes = sanitizeAttributes(tagName, String(rawAttributes ?? ""));

    if (tagName === "a" && !safeAttributes) {
      return "";
    }

    return VOID_TAGS.has(tagName)
      ? `<${tagName}${safeAttributes}>`
      : `<${tagName}${safeAttributes}>`;
  });

  return sanitized.trim();
}

export function sanitizeSignatureLinkUrl(url: string) {
  const normalized = url.trim();
  return isSafeUrl(normalized, "href") ? normalized : null;
}
