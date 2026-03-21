export function formatInteger(value: number) {
  const normalized = Math.trunc(value);

  return normalized
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const kaShortDateFormatter = new Intl.DateTimeFormat("ka-GE", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Tbilisi",
});

export function formatKaShortDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return kaShortDateFormatter.format(date);
}
