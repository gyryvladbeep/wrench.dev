/**
 * Общие типы для конструкторов консольных команд (ADB, simctl).
 * Файл без React: описания команд — чистые данные + чистые функции,
 * поэтому их можно проверять отдельно от интерфейса.
 */
export type Values = Record<string, string | boolean>;

export interface SelectOption {
  value: string;
  label: string;
  labelRu?: string;
}

export interface FieldDef {
  key: string;
  label: string;
  labelRu: string;
  type: "text" | "check" | "select";
  default: string | boolean;
  placeholder?: string;
  options?: SelectOption[];
  /** Поле показывается только когда условие истинно. */
  when?: (v: Values) => boolean;
}

export interface CommandDef {
  id: string;
  group: string;
  groupRu: string;
  label: string;
  labelRu: string;
  note?: string;
  noteRu?: string;
  fields: FieldDef[];
  /** v — значения полей команды, g — значения глобальных полей (серийный номер, устройство). */
  build: (v: Values, g: Values) => string[];
}

/** Значение текстового поля или подсказка <name>, если поле пустое. */
export function req(v: Values, key: string, placeholder: string): string {
  const raw = v[key];
  const s = typeof raw === "string" ? raw.trim() : "";
  return s || `<${placeholder}>`;
}

/** Необязательное текстовое поле: пустая строка, если не заполнено. */
export function opt(v: Values, key: string): string {
  const raw = v[key];
  return typeof raw === "string" ? raw.trim() : "";
}

export function on(v: Values, key: string): boolean {
  return v[key] === true;
}

/** Собирает команду из частей, пропуская пустые. */
export function join(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
}

export function defaultsFor(fields: FieldDef[]): Values {
  const out: Values = {};
  for (const f of fields) out[f.key] = f.default;
  return out;
}
