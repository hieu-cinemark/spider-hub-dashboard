// The `cast` column of the `movies` table holds two different shapes, and
// both are in production today:
//
//   '["Nguyễn Hùng", "Võ Điền Gia Huy", "Ngọc Xuân"]'   <- Worker cinemark writes JSON
//   'Steven Nguyễn, Ngô Kiến Huy, Otis'                  <- older rows, plain text
//
// The API passes the column through untouched, so the dashboard has to
// normalize it before display - otherwise the table shows a raw JSON array
// for some films and a comma list for others. This mirrors the same
// normalization cinemark-api does on its side (app/ai/movie_context.cast_list),
// so both ends of the pipeline agree on what "the cast" means.

const SPLIT = /[,;·•|/]+/;

export function formatCast(raw: string | null | undefined): string {
  if (!raw) return "";
  const text = raw.trim();
  if (!text) return "";

  let items: string[];
  try {
    const parsed = JSON.parse(text);
    items = Array.isArray(parsed) ? parsed.map((v) => String(v)) : [text];
  } catch {
    // Not JSON - fall back to splitting the plain "A, B; C" form.
    items = text.split(SPLIT);
  }

  const names: string[] = [];
  for (const item of items) {
    const name = item.trim().replace(/^["']|["']$/g, "").replace(/\.$/, "").trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names.join(", ");
}
