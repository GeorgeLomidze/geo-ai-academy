export function formatRelativeTime(date: Date | string) {
  const timestamp = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return "ახლახან";
  if (diffMinutes < 60) return `${diffMinutes} წუთის წინ`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} საათის წინ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} დღის წინ`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} თვის წინ`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} წლის წინ`;
}
