/**
 * Georgian → Latin transliteration map
 * Standard national transliteration system
 */
const GEO_TO_LATIN: Record<string, string> = {
  ა: "a",
  ბ: "b",
  გ: "g",
  დ: "d",
  ე: "e",
  ვ: "v",
  ზ: "z",
  თ: "t",
  ი: "i",
  კ: "k",
  ლ: "l",
  მ: "m",
  ნ: "n",
  ო: "o",
  პ: "p",
  ჟ: "zh",
  რ: "r",
  ს: "s",
  ტ: "t",
  უ: "u",
  ფ: "p",
  ქ: "k",
  ღ: "gh",
  ყ: "q",
  შ: "sh",
  ჩ: "ch",
  ც: "ts",
  ძ: "dz",
  წ: "ts",
  ჭ: "ch",
  ხ: "kh",
  ჯ: "j",
  ჰ: "h",
};

function transliterate(text: string): string {
  return text
    .split("")
    .map((char) => GEO_TO_LATIN[char] ?? char)
    .join("");
}

/**
 * Generate a URL-safe slug from any text (supports Georgian).
 * Georgian text is transliterated to Latin first, then converted to kebab-case.
 */
export function slugify(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-") // spaces/underscores → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
