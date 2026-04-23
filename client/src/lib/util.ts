export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function fmtScore(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function mdToBlocks(md: string): ({ kind: "p" | "h"; text: string })[] {
  // tiny markdown rendering: "**bold**" lines followed by paragraphs.
  const blocks: { kind: "p" | "h"; text: string }[] = [];
  for (const raw of md.split(/\n\n+/)) {
    const t = raw.trim();
    if (!t) continue;
    const m = t.match(/^\*\*(.+)\*\*$/);
    if (m) blocks.push({ kind: "h", text: m[1] });
    else blocks.push({ kind: "p", text: t });
  }
  return blocks;
}
