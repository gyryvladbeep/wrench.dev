export interface Person {
  username: string;
  name: string;
}

export interface MentionHit {
  person: Person;
  score: number;
  reason: "exact" | "username-prefix" | "name-prefix" | "substring";
  via: "query" | "layout";
}

const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = "йцукенгшщзхъфывапролджэячсмитьбюё";

/** Нормализация для поиска: регистр, диакритика, ё, разделители. */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Переводит текст, набранный в чужой раскладке (ЙЦУКЕН и QWERTY), в другую раскладку. */
export function fixLayout(text: string): string {
  let out = "";
  for (const ch of text.toLowerCase()) {
    const e = EN.indexOf(ch);
    const r = RU.indexOf(ch);
    out += e >= 0 ? RU[e] : r >= 0 ? EN[r] : ch;
  }
  return out;
}

function score(person: Person, q: string): { score: number; reason: MentionHit["reason"] } | null {
  const u = normalizeSearch(person.username);
  const n = normalizeSearch(person.name);
  if (!q) return null;
  if (u === q) return { score: 100, reason: "exact" };
  if (u.startsWith(q)) return { score: 80, reason: "username-prefix" };
  if (n.split(" ").some((w) => w.startsWith(q)) || n.startsWith(q)) return { score: 70, reason: "name-prefix" };
  if (u.includes(q) || n.includes(q)) return { score: 40, reason: "substring" };
  return null;
}

export function searchMentions(people: Person[], query: string): MentionHit[] {
  const q = normalizeSearch(query);
  const fixed = normalizeSearch(fixLayout(query));
  const hits: MentionHit[] = [];
  for (const person of people) {
    const a = score(person, q);
    const b = fixed !== q ? score(person, fixed) : null;
    // Совпадение через исправленную раскладку чуть слабее прямого.
    const best = a && (!b || a.score >= b.score - 5) ? { ...a, via: "query" as const } : b ? { score: b.score - 5, reason: b.reason, via: "layout" as const } : null;
    if (best) hits.push({ person, score: best.score, reason: best.reason, via: best.via });
  }
  return hits.sort((x, y) => y.score - x.score || x.person.username.localeCompare(y.person.username));
}

export function parsePeople(text: string): Person[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [u, ...rest] = l.split("|");
    const username = u.trim();
    return { username, name: rest.join("|").trim() || username };
  });
}

export const SAMPLE_PEOPLE = `alice | Alice Johnson
alina.k | Алина Ковалёва
anton | Антон Петров
bob_smith | Bob Smith
jose | José García
zoe | Zoë Lang`;
