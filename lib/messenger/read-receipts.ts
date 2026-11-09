export interface Member {
  name: string;
  lastRead: number;
}

export interface ReceiptRow {
  seq: number;
  author: string | null;
  readBy: string[];
  unreadBy: string[];
  label: string;
}

export interface ReceiptReport {
  rows: ReceiptRow[];
  notes: { code: string; en: string; ru: string }[];
}

export function parseMembers(text: string): Member[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name, n] = l.split(":");
    return { name: name.trim(), lastRead: Number(n) };
  });
}

/** Строки "seq: автор". Если автор не указан, сообщение считается входящим для всех. */
export function parseAuthors(text: string): Map<number, string> {
  const m = new Map<number, string>();
  for (const l of text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) {
    const [seq, name] = l.split(":");
    if (name !== undefined && Number.isFinite(Number(seq))) m.set(Number(seq), name.trim());
  }
  return m;
}

export function receiptLabel(readBy: string[], audience: number, maxNames: number): string {
  if (audience === 0) return "";
  if (readBy.length === 0) return "Sent";
  if (readBy.length === audience && audience > 1) return audience <= maxNames ? `Read by ${list(readBy)}` : "Read by all";
  if (readBy.length <= maxNames) return `Read by ${list(readBy)}`;
  const shown = readBy.slice(0, maxNames);
  const rest = readBy.length - shown.length;
  return `Read by ${shown.join(", ")} and ${rest} other${rest === 1 ? "" : "s"}`;
}

function list(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

export function computeReceipts(members: Member[], authors: Map<number, string>, total: number, maxNames: number): ReceiptReport {
  const notes: ReceiptReport["notes"] = [];
  const rows: ReceiptRow[] = [];
  const last = Math.max(0, Math.floor(total));
  for (const m of members) {
    if (!Number.isFinite(m.lastRead)) notes.push({ code: "bad-pointer", en: `${m.name}: the read pointer is not a number.`, ru: `${m.name}: указатель прочтения не число.` });
    else if (m.lastRead > last) notes.push({ code: "pointer-beyond-last", en: `${m.name}: the read pointer ${m.lastRead} is beyond the last message ${last}.`, ru: `${m.name}: указатель прочтения ${m.lastRead} дальше последнего сообщения ${last}.` });
  }
  for (let seq = 1; seq <= last; seq++) {
    const author = authors.get(seq) ?? null;
    const audience = members.filter((m) => m.name !== author);
    const readBy = audience.filter((m) => m.lastRead >= seq).map((m) => m.name);
    const unreadBy = audience.filter((m) => !(m.lastRead >= seq)).map((m) => m.name);
    rows.push({ seq, author, readBy, unreadBy, label: author ? receiptLabel(readBy, audience.length, maxNames) : "" });
  }
  if (rows.some((r) => r.author && r.readBy.length === 0)) notes.push({ code: "unread-own", en: "Some own messages have not been read by anyone yet.", ru: "Часть собственных сообщений пока никто не прочитал." });
  return { rows, notes };
}

export const SAMPLE_MEMBERS = `Alice: 6
Bob: 4
Chen: 2
Dana: 0
Eli: 9`;

export const SAMPLE_AUTHORS = `1: Alice
3: Alice
5: Bob
6: Alice`;
