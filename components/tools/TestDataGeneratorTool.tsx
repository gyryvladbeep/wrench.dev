"use client";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const FIRST_NAMES = ["Alice","Bob","Carol","David","Emma","Frank","Grace","Henry","Iris","Jack","Kate","Leo","Maria","Nick","Olivia","Paul","Quinn","Rachel","Sam","Tina"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris"];
const DOMAINS     = ["gmail.com","yahoo.com","outlook.com","company.com","example.org","test.io"];
const CITIES      = ["New York","London","Berlin","Paris","Tokyo","Toronto","Sydney","Amsterdam","Madrid","Rome"];
const STATUSES    = ["active","inactive","pending","suspended"];
const ROLES       = ["user","admin","manager","editor","viewer"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randId() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }
function randDate(yearsBack = 5) {
  const d = new Date(Date.now() - Math.random() * yearsBack * 365 * 86400000);
  return d.toISOString().slice(0, 10);
}
function randPhone() { return `+1 ${randInt(200,999)}-${randInt(100,999)}-${randInt(1000,9999)}`; }

function generateRow(schema: string[]) {
  const first = rand(FIRST_NAMES), last = rand(LAST_NAMES);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@${rand(DOMAINS)}`;
  const map: Record<string, string | number | boolean> = {
    id:         randInt(1000, 99999),
    uuid:       `${randId()}-${randId()}-${randId()}`,
    first_name: first,
    last_name:  last,
    name:       `${first} ${last}`,
    email,
    phone:      randPhone(),
    age:        randInt(18, 65),
    city:       rand(CITIES),
    country:    "US",
    status:     rand(STATUSES),
    role:       rand(ROLES),
    score:      randInt(0, 100),
    created_at: randDate(),
    is_active:  Math.random() > 0.3,
    balance:    parseFloat((Math.random() * 10000).toFixed(2)),
  };
  const row: Record<string, string | number | boolean> = {};
  schema.forEach(f => { row[f] = map[f] ?? `value_${f}`; });
  return row;
}

const PRESETS: { label: string; labelRu: string; fields: string[] }[] = [
  { label:"User",    labelRu:"Пользователь", fields:["id","name","email","role","status","created_at"] },
  { label:"Profile", labelRu:"Профиль",      fields:["id","first_name","last_name","email","phone","age","city"] },
  { label:"Product", labelRu:"Продукт",      fields:["id","name","score","balance","status","created_at"] },
];

const ALL_FIELDS = ["id","uuid","first_name","last_name","name","email","phone","age","city","country","status","role","score","created_at","is_active","balance"];

export function TestDataGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [count,  setCount]  = useState(5);
  const [fields, setFields] = useState(["id","name","email","role","status"]);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [data,   setData]   = useState<Record<string, string | number | boolean>[]>([]);

  function generate() {
    const rows = Array.from({ length: count }, () => generateRow(fields));
    setData(rows);
  }

  function toggleField(f: string) {
    setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setFields(p.fields);
  }

  const output = data.length === 0 ? "" : format === "json"
    ? JSON.stringify(data, null, 2)
    : [fields.join(","), ...data.map(r => fields.map(f => JSON.stringify(r[f])).join(","))].join("\n");

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <label className="input-label">{isRu ? "Пресеты" : "Presets"}</label>
        <div className="flex gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
              {isRu ? p.labelRu : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div>
        <label className="input-label">{isRu ? "Поля" : "Fields"}</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_FIELDS.map(f => (
            <button key={f} onClick={() => toggleField(f)}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${fields.includes(f) ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="input-label">{isRu ? "Кол-во строк" : "Row count"}</label>
          <input type="number" value={count} onChange={e => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
            min={1} max={100} className="code-surface w-24 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
        </div>
        <div className="flex rounded border border-border overflow-hidden">
          {(["json","csv"] as const).map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className={`px-3 py-2 text-xs transition-colors ${format === f ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={generate}
          className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:bg-amber-400 transition-colors">
          {isRu ? "Генерировать" : "Generate"}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="input-label mb-0">{isRu ? "Результат" : "Result"} ({data.length} {isRu ? "строк" : "rows"})</label>
            <CopyButton value={output} />
          </div>
          <textarea readOnly value={output} rows={12} spellCheck={false}
            className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
        </div>
      )}
    </div>
  );
}