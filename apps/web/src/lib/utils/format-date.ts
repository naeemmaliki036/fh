export function formatDate(
  value: string | Date | null | undefined,
  locale: string | undefined | null,
): string {
  if (!value) return "";
  const tag = locale === "ar" ? "ar-AE" : "en-AE";
  return new Date(value).toLocaleDateString(tag, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
