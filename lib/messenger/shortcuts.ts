import { Finding, finding, sortFindings } from "../mobile/findings";

export interface Shortcut {
  combo: string;
  label: string;
  mods: string[];
  key: string;
}

const MOD_ORDER = ["ctrl", "alt", "shift", "meta"];
const MOD_ALIASES: Record<string, string> = { ctrl: "ctrl", control: "ctrl", cmd: "meta", command: "meta", meta: "meta", win: "meta", alt: "alt", option: "alt", opt: "alt", shift: "shift", mod: "ctrl" };
const KEY_ALIASES: Record<string, string> = { esc: "escape", return: "enter", del: "delete", pgup: "pageup", pgdn: "pagedown", " ": "space", spacebar: "space", plus: "+", minus: "-" };

/** Приводит "Ctrl + k", "cmd+K" и т.п. к единому виду. Mod считается как Ctrl (на Mac это Cmd). */
export function parseCombo(raw: string): { mods: string[]; key: string } | null {
  const parts = raw.split("+").map((p) => p.trim()).filter((p, i, a) => p !== "" || i === a.length - 1);
  if (raw.trim().endsWith("++")) parts.splice(parts.length - 1, 1, "+");
  const mods = new Set<string>();
  let key = "";
  for (const p of parts) {
    const low = p.toLowerCase();
    if (MOD_ALIASES[low]) mods.add(MOD_ALIASES[low]);
    else key = KEY_ALIASES[low] ?? low;
  }
  if (!key) return null;
  return { mods: MOD_ORDER.filter((m) => mods.has(m)), key };
}

export function formatCombo(mods: string[], key: string): string {
  const name = (m: string) => (m === "meta" ? "Cmd/Win" : m[0].toUpperCase() + m.slice(1));
  const k = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1);
  return [...mods.map(name), k].join("+");
}

export function parseShortcuts(text: string): { list: Shortcut[]; errors: string[] } {
  const list: Shortcut[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const idx = line.indexOf(":");
    const comboRaw = idx >= 0 ? line.slice(0, idx) : line;
    const label = idx >= 0 ? line.slice(idx + 1).trim() : "";
    const c = parseCombo(comboRaw);
    if (!c) { errors.push(`Line ${i + 1}: cannot read the combination.`); return; }
    list.push({ combo: formatCombo(c.mods, c.key), label, mods: c.mods, key: c.key });
  });
  return { list, errors };
}

const id = (mods: string[], key: string) => [...mods, key].join("+");

/** Комбинации, которые браузер забирает до страницы: preventDefault не помогает. */
const RESERVED = new Set([
  id(["ctrl"], "n"), id(["ctrl"], "t"), id(["ctrl"], "w"), id(["ctrl", "shift"], "n"), id(["ctrl", "shift"], "t"), id(["ctrl", "shift"], "w"),
  id(["ctrl"], "tab"), id(["ctrl", "shift"], "tab"), id(["ctrl"], "pageup"), id(["ctrl"], "pagedown"), id(["alt"], "f4"),
]);

/** Комбинации, которые страница может перехватить, но они конфликтуют с привычными действиями браузера. */
const COMMON: Record<string, string> = {
  [id(["ctrl"], "f")]: "find in page", [id(["ctrl"], "l")]: "focus the address bar", [id(["ctrl"], "d")]: "bookmark", [id(["ctrl"], "p")]: "print",
  [id(["ctrl"], "s")]: "save page", [id(["ctrl"], "r")]: "reload", [id(["ctrl", "shift"], "r")]: "hard reload", [id(["ctrl"], "u")]: "view source",
  [id(["ctrl"], "h")]: "history", [id(["ctrl"], "j")]: "downloads", [id(["ctrl"], "k")]: "search from the address bar (Chrome) or search bar (Firefox)",
  [id(["ctrl"], "e")]: "search from the address bar", [id(["ctrl", "shift"], "i")]: "developer tools", [id(["ctrl", "shift"], "j")]: "console / downloads",
  [id(["ctrl", "shift"], "c")]: "inspect element", [id(["ctrl", "shift"], "k")]: "web console (Firefox)", [id(["alt"], "arrowleft")]: "browser back",
  [id(["alt"], "arrowright")]: "browser forward", [id(["alt"], "d")]: "focus the address bar", [id(["ctrl"], "0")]: "reset zoom", [id(["ctrl"], "+")]: "zoom in",
  [id(["ctrl"], "-")]: "zoom out", f5: "reload", f11: "full screen", f12: "developer tools", [id(["ctrl"], "1")]: "switch to tab 1", [id(["ctrl"], "9")]: "switch to the last tab",
};

const MAC_RESERVED: Record<string, string> = {
  [id(["meta"], "q")]: "quit the app", [id(["meta"], "h")]: "hide the app", [id(["meta"], "m")]: "minimize", [id(["meta"], "space")]: "Spotlight",
  [id(["meta"], "n")]: "new window", [id(["meta"], "t")]: "new tab", [id(["meta"], "w")]: "close tab",
};

export function checkShortcuts(list: Shortcut[]): Finding[] {
  const f: Finding[] = [];
  const seen = new Map<string, Shortcut>();
  for (const s of list) {
    const k = id(s.mods, s.key);
    const prev = seen.get(k);
    if (prev) f.push(finding("error", "duplicate", `${s.combo} is used twice: "${prev.label || "?"}" and "${s.label || "?"}".`, `${s.combo} назначена дважды: "${prev.label || "?"}" и "${s.label || "?"}".`));
    else seen.set(k, s);
    if (RESERVED.has(k)) f.push(finding("error", "reserved", `${s.combo} is taken by the browser before the page (new tab, close tab and similar); the app cannot reliably handle it.`, `${s.combo} забирает браузер раньше страницы (новая вкладка, закрытие и т.п.), приложение не сможет надёжно её обработать.`));
    else if (COMMON[k]) f.push(finding("warning", "browser-common", `${s.combo} is a browser shortcut (${COMMON[k]}). The app can override it, but users will be surprised.`, `${s.combo} — сочетание браузера (${COMMON[k]}). Приложение может его перехватить, но пользователи удивятся.`));
    if (MAC_RESERVED[k]) f.push(finding("warning", "mac-reserved", `${s.combo} is a macOS shortcut (${MAC_RESERVED[k]}) when Cmd is the modifier.`, `${s.combo} — сочетание macOS (${MAC_RESERVED[k]}), если модификатор Cmd.`));
    if (s.mods.length === 0 && s.key.length === 1) f.push(finding("warning", "plain-key", `${s.combo} is a plain key: it must be ignored while the user types in the message field.`, `${s.combo} — одиночная клавиша: пока пользователь печатает в поле сообщения, её нужно игнорировать.`));
    if (s.mods.includes("ctrl") && s.mods.includes("alt") && s.key.length === 1) f.push(finding("warning", "altgr", `${s.combo}: on Windows Ctrl+Alt is AltGr, which types letters on many keyboard layouts (for example Polish and German).`, `${s.combo}: в Windows Ctrl+Alt — это AltGr, на многих раскладках (например, польской и немецкой) он вводит буквы.`));
    if (s.mods.length === 1 && s.mods[0] === "alt" && s.key.length === 1) f.push(finding("info", "alt-letter", `${s.combo}: Alt plus a letter types characters on some layouts and opens browser menus on some systems.`, `${s.combo}: Alt с буквой на части раскладок вводит символы, а в некоторых системах открывает меню браузера.`));
  }
  if (f.length === 0 && list.length > 0) f.push(finding("info", "ok", "No known conflicts found.", "Известных конфликтов не найдено."));
  return sortFindings(f);
}

export const SAMPLE_SHORTCUTS = `Ctrl+K: Quick switcher
Ctrl+N: New message
Ctrl+F: Search in channel
Ctrl+Shift+T: Open threads
Ctrl+Alt+M: Mention
/: Focus the composer
Ctrl+K: Insert link
Cmd+H: Open history
Alt+Up: Previous unread channel`;
