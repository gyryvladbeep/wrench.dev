export interface Dimension {
  name: string;
  values: string[];
}

export const DEFAULT_DIMENSIONS = `Network: online, offline, slow 3G, flaky (drops every 5 s), back online after 10 min
Action: send text, send file, edit message, delete message, add reaction, reply in thread, mark as unread
App state: foreground, background tab, page reloaded, two tabs open, signed out in another tab
Content: short text, 4000 characters, emoji and RTL, attachment at the size limit`;

export function parseDimensions(text: string): { dims: Dimension[]; errors: string[] } {
  const dims: Dimension[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const idx = line.indexOf(":");
    if (idx < 1) { errors.push(`Line ${i + 1}: use "Name: value, value".`); return; }
    const values = line.slice(idx + 1).split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length < 1) { errors.push(`Line ${i + 1}: no values.`); return; }
    dims.push({ name: line.slice(0, idx).trim(), values: [...new Set(values)] });
  });
  if (dims.length < 2 && errors.length === 0) errors.push("Add at least two dimensions.");
  return { dims, errors };
}

export function fullCount(dims: Dimension[]): number {
  return dims.reduce((n, d) => n * d.values.length, 1);
}

export function fullFactorial(dims: Dimension[], limit = 5000): string[][] {
  let rows: string[][] = [[]];
  for (const d of dims) {
    const next: string[][] = [];
    for (const r of rows) for (const v of d.values) { next.push([...r, v]); if (next.length >= limit) return next; }
    rows = next;
  }
  return rows;
}

const key = (i: number, vi: number, j: number, vj: number) => `${i}:${vi}|${j}:${vj}`;

/** Жадный pairwise: каждая пара значений двух параметров встречается хотя бы в одной строке. */
export function pairwise(dims: Dimension[]): string[][] {
  const n = dims.length;
  if (n === 0) return [];
  if (n === 1) return dims[0].values.map((v) => [v]);
  const uncovered = new Set<string>();
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    for (let a = 0; a < dims[i].values.length; a++) for (let b = 0; b < dims[j].values.length; b++) uncovered.add(key(i, a, j, b));
  const rows: number[][] = [];
  while (uncovered.size > 0) {
    const first = uncovered.values().next().value as string;
    const [l, r] = first.split("|");
    const [i0, a0] = l.split(":").map(Number);
    const [j0, b0] = r.split(":").map(Number);
    const row: number[] = new Array(n).fill(-1);
    row[i0] = a0; row[j0] = b0;
    for (let p = 0; p < n; p++) {
      if (row[p] !== -1) continue;
      let best = 0, bestGain = -1;
      for (let v = 0; v < dims[p].values.length; v++) {
        let gain = 0;
        for (let q = 0; q < n; q++) {
          if (row[q] === -1 || q === p) continue;
          const k = q < p ? key(q, row[q], p, v) : key(p, v, q, row[q]);
          if (uncovered.has(k)) gain++;
        }
        if (gain > bestGain) { bestGain = gain; best = v; }
      }
      row[p] = best;
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) uncovered.delete(key(i, row[i], j, row[j]));
    rows.push(row);
  }
  return rows.map((r) => r.map((v, i) => dims[i].values[v]));
}

/** Пары значений, которых нет ни в одной строке. */
export function missingPairs(dims: Dimension[], rows: string[][]): number {
  let missing = 0;
  for (let i = 0; i < dims.length; i++) for (let j = i + 1; j < dims.length; j++)
    for (const a of dims[i].values) for (const b of dims[j].values)
      if (!rows.some((r) => r[i] === a && r[j] === b)) missing++;
  return missing;
}

export function toMarkdown(dims: Dimension[], rows: string[][]): string {
  const head = ["#", ...dims.map((d) => d.name), "Expected result", "Result"];
  const lines = [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`];
  rows.forEach((r, i) => lines.push(`| ${[`TC-${String(i + 1).padStart(3, "0")}`, ...r, "", ""].join(" | ")} |`));
  return lines.join("\n");
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(dims: Dimension[], rows: string[][]): string {
  const head = ["id", ...dims.map((d) => d.name), "expected", "result"];
  return [head.map(csvCell).join(","), ...rows.map((r, i) => [`TC-${String(i + 1).padStart(3, "0")}`, ...r, "", ""].map(csvCell).join(","))].join("\n");
}
