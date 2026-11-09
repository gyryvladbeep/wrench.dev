export interface LinkFinding {
  raw: string;
  /** Что остаётся после отсечения знаков препинания в конце. */
  text: string;
  kind: "url" | "www" | "email";
  href: string;
  host: string;
  flags: string[];
}

export interface AutolinkSample {
  id: string;
  text: string;
  noteEn: string;
  noteRu: string;
}

const CANDIDATE_RE = /(?:https?:\/\/|www\.)[^\s<>"]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/gi;

/** Отсекает знаки препинания справа; закрывающую скобку оставляет, если она парная. */
export function trimTrailing(url: string): string {
  let s = url;
  for (;;) {
    const last = s[s.length - 1];
    if (!last) return s;
    if (".,;:!?'\"*".includes(last)) { s = s.slice(0, -1); continue; }
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    if (pairs[last]) {
      const open = pairs[last];
      const opens = s.split(open).length - 1;
      const closes = s.split(last).length - 1;
      if (closes > opens) { s = s.slice(0, -1); continue; }
    }
    return s;
  }
}

function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "[::1]") return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

export function findLinks(text: string): LinkFinding[] {
  const out: LinkFinding[] = [];
  for (const m of text.matchAll(CANDIDATE_RE)) {
    const raw = m[0];
    const t = trimTrailing(raw);
    if (!t) continue;
    const flags: string[] = [];
    if (t.includes("@") && !/^https?:\/\//i.test(t) && !/^www\./i.test(t)) {
      out.push({ raw, text: t, kind: "email", href: `mailto:${t}`, host: t.split("@")[1], flags });
      continue;
    }
    const withScheme = /^https?:\/\//i.test(t) ? t : `http://${t}`;
    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      continue;
    }
    if (url.username || url.password) flags.push("userinfo");
    if (url.hostname.split(".").some((l) => l.startsWith("xn--"))) flags.push("punycode");
    if (isPrivateHost(url.hostname)) flags.push("private");
    if (url.port) flags.push("port");
    if (url.protocol === "http:" && /^https?:/i.test(t) && /^http:/i.test(t)) flags.push("insecure");
    if (t.length > 200) flags.push("long");
    out.push({ raw, text: t, kind: /^www\./i.test(t) ? "www" : "url", href: url.href, host: url.hostname, flags });
  }
  return out;
}

export const FLAG_LABELS: Record<string, { en: string; ru: string }> = {
  userinfo: { en: "Contains credentials before the host: the real host differs from what comes first.", ru: "Содержит логин или пароль перед хостом: настоящий хост отличается от того, что идёт первым." },
  punycode: { en: "Internationalized domain (punycode): can imitate a familiar domain.", ru: "Международный домен (punycode): может имитировать знакомый домен." },
  private: { en: "Local or private address: only reachable from some networks.", ru: "Локальный или частный адрес: доступен не из всех сетей." },
  port: { en: "Explicit port.", ru: "Явно указан порт." },
  insecure: { en: "Plain HTTP, not HTTPS.", ru: "Обычный HTTP, а не HTTPS." },
  long: { en: "Very long URL (over 200 characters).", ru: "Очень длинный URL (больше 200 символов)." },
};

export const AUTOLINK_SAMPLES: AutolinkSample[] = [
  { id: "punct", text: "See https://example.com/path, https://example.com/x. And (https://example.com/y)!", noteEn: "Trailing comma, period, parenthesis and exclamation mark.", noteRu: "Запятая, точка, скобка и восклицательный знак в конце." },
  { id: "parens", text: "Docs: https://en.wikipedia.org/wiki/Function_(mathematics) end", noteEn: "Balanced parentheses stay inside the URL.", noteRu: "Парные скобки остаются внутри URL." },
  { id: "idn", text: "https://пример.рф/страница https://münchen.de/straße", noteEn: "Internationalized domains.", noteRu: "Международные домены." },
  { id: "phish", text: "https://trusted.com@evil.example/login", noteEn: "Credentials trick: the real host is evil.example.", noteRu: "Приём с логином: настоящий хост evil.example." },
  { id: "local", text: "http://localhost:3000/app http://192.168.0.1:8080 http://[::1]:5173/", noteEn: "Local and private addresses.", noteRu: "Локальные и частные адреса." },
  { id: "mixed", text: "Mail team@example.com or open www.example.com/docs?a=1&b=2 now", noteEn: "Email and a www link without a scheme.", noteRu: "Email и ссылка www без схемы." },
  { id: "schemes", text: "javascript:alert(1) ftp://files.example.com data:text/html,x", noteEn: "Only http(s), www and email are linked by this reference.", noteRu: "Эта эталонная проверка ссылается только на http(s), www и email." },
];
