"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ─── Pure deterministic fake-data generators ─────────────────────────────────
// No external dependencies — everything here is hand-rolled from word lists.
// This is intentionally minimal; it doesn't need to be Faker.js.

const FIRST_NAMES = ["Ada","Grace","Alan","Linus","Margaret","Tim","Dennis","James","Barbara","Ken","Guido","Brendan","Hedy","Claude","John","Mary","David","Sarah","Michael","Laura","Robert","Emily","Thomas","Sophie","William","Emma"];
const LAST_NAMES = ["Lovelace","Hopper","Turing","Torvalds","Hamilton","Berners-Lee","Ritchie","Gosling","Liskov","Thompson","Van Rossum","Eich","Lamarr","Shannon","McCarthy","Doe","Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson"];
const DOMAINS = ["example.com","mail.dev","testcorp.io","fakemail.net","devbox.dev","sample.org"];
const COMPANIES = ["Acme Corp","TechNova","DevFlow","CodeStack","BuildBase","StartupX","NexGen Systems","CloudShift","DataBridge","InnoTech"];
const STREETS = ["Main St","Oak Ave","Elm St","Pine Rd","Maple Dr","Cedar Ln","Walnut Blvd","Birch Way","Spruce Ct"];
const CITIES = ["San Francisco","Austin","Berlin","Toronto","Amsterdam","Singapore","London","Tokyo","Sydney","Warsaw","Kyiv","Yerevan"];
const TLDS = [".com",".io",".dev",".net",".org"];

let seed = 42;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function int(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
function pad(n: number, l: number) { return String(n).padStart(l, "0"); }

function genName()     { return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }
function genUsername(name: string) { return (name.split(" ")[0].toLowerCase() + int(1, 999)).replace(/\s/g, ""); }
function genEmail(name: string)    { return `${genUsername(name)}@${pick(DOMAINS)}`; }
function genPhone()    { return `+1-${int(200,999)}-${int(100,999)}-${pad(int(0,9999),4)}`; }
function genAddress()  { return `${int(1,9999)} ${pick(STREETS)}, ${pick(CITIES)}`; }
function genCompany()  { return pick(COMPANIES); }
function genUuid() {
  const hex = (n: number) => n.toString(16).padStart(8, "0");
  const r = () => int(0, 0xffffffff);
  return `${hex(r()).slice(0,8)}-${hex(r()).slice(0,4)}-4${hex(r()).slice(0,3)}-${["8","9","a","b"][int(0,3)]}${hex(r()).slice(0,3)}-${hex(r())}${hex(r()).slice(0,4)}`;
}
function genDate() {
  const y = int(1980, 2005), m = pad(int(1,12),2), d = pad(int(1,28),2);
  return `${y}-${m}-${d}`;
}
function genNumber() { return int(1, 99999); }
function genBoolean() { return rand() > 0.5 ? "true" : "false"; }

type FieldKey = "name"|"email"|"phone"|"address"|"company"|"username"|"uuid"|"date"|"number"|"boolean";

function generateRow(fields: FieldKey[]): Record<string, string> {
  const name = genName();
  const row: Record<string, string> = {};
  for (const f of fields) {
    switch (f) {
      case "name":     row[f] = name; break;
      case "email":    row[f] = genEmail(name); break;
      case "phone":    row[f] = genPhone(); break;
      case "address":  row[f] = genAddress(); break;
      case "company":  row[f] = genCompany(); break;
      case "username": row[f] = genUsername(name); break;
      case "uuid":     row[f] = genUuid(); break;
      case "date":     row[f] = genDate(); break;
      case "number":   row[f] = String(genNumber()); break;
      case "boolean":  row[f] = genBoolean(); break;
    }
  }
  return row;
}

function toJson(rows: Record<string, string>[]): string {
  return JSON.stringify(rows, null, 2);
}
function toCsv(rows: Record<string, string>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = rows.map(r => headers.map(h => `"${(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...csvRows].join("\n");
}
function toSqlInsert(rows: Record<string, string>[], table = "users"): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const cols = headers.join(", ");
  const valueLines = rows.map(r => `(${headers.map(h => `'${(r[h] ?? "").replace(/'/g, "''")}'`).join(", ")})`);
  return `INSERT INTO ${table} (${cols}) VALUES\n${valueLines.join(",\n")};`;
}

type Format = "json" | "csv" | "sql";

export function FakeDataGeneratorTool({ dict }: { dict: Dictionary }) {
  const t = dict.tools.fakeData;
  const FIELD_KEYS: FieldKey[] = ["name","email","phone","address","company","username","uuid","date","number","boolean"];
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set(["name","email","phone"]));
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<Format>("json");
  const [output, setOutput] = useState("");

  function toggleField(key: FieldKey) {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const generate = useCallback(() => {
    const fields = FIELD_KEYS.filter(k => selectedFields.has(k));
    if (!fields.length) { setOutput(""); return; }
    seed = Date.now() & 0xffffffff;
    const rows = Array.from({ length: Math.min(count, 500) }, () => generateRow(fields));
    setOutput(format === "json" ? toJson(rows) : format === "csv" ? toCsv(rows) : toSqlInsert(rows));
  }, [selectedFields, count, format]);

  function download() {
    const ext = format === "json" ? "json" : format === "csv" ? "csv" : "sql";
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `fake-data.${ext}`; a.click();
  }

  const fieldLabels: Record<FieldKey, string> = {
    name: t.fields.name, email: t.fields.email, phone: t.fields.phone,
    address: t.fields.address, company: t.fields.company, username: t.fields.username,
    uuid: t.fields.uuid, date: t.fields.date, number: t.fields.number, boolean: t.fields.boolean,
  };

  return (
    <div>
      {/* Fields */}
      <div className="flex flex-wrap gap-2">
        {FIELD_KEYS.map(key => (
          <button
            key={key}
            onClick={() => toggleField(key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              selectedFields.has(key)
                ? "bg-accent text-accent-fg"
                : "bg-surface text-text-muted hover:bg-surface-hover"
            }`}
          >
            {fieldLabels[key]}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t.countLabel}</label>
          <input
            type="number" min={1} max={500} value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="code-surface w-20 rounded-[10px] p-2 text-sm text-text-primary outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t.formatLabel}</label>
          <div className="flex gap-1">
            {(["json","csv","sql"] as Format[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-[10px] px-3 py-1.5 text-sm ${
                  format === f ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"
                }`}
              >
                {t.formats[f]}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={generate}>{t.generate}</Button>
        <div className="ml-auto flex gap-2">
          <CopyButton value={output} label={t.copyAll} copiedLabel={dict.common.copied} />
          <Button variant="secondary" disabled={!output} onClick={download}>{t.download}</Button>
        </div>
      </div>

      {selectedFields.size === 0 && (
        <p className="mt-3 text-sm text-text-muted">{t.noFieldsHint}</p>
      )}

      {output && (
        <textarea
          readOnly value={output} spellCheck={false}
          className="code-surface mt-4 h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
        />
      )}
    </div>
  );
}
