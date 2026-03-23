export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(
  dateString: string,
  locale: "ja" | "en" = "ja"
): string {
  const date = new Date(`${dateString}T00:00:00`);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w =
    locale === "en"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]
      : ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${m}/${d} (${w})`;
}
