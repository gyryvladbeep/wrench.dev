"use client";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type Row = Record<string, string | number | boolean>;

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(yearsBack = 3) {
  const d = new Date(Date.now() - Math.random() * yearsBack * 365 * 86400000);
  return d.toISOString().slice(0, 10);
}

const FIRST_NAMES = ["Alice","Bob","Carol","David","Emma","Frank","Grace","Henry","Iris","Jack","Kate","Leo","Maria","Nick","Olivia","Paul"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor","Anderson","Harris"];
const DOMAINS     = ["gmail.com","yahoo.com","outlook.com","company.com","example.org"];
const CITIES      = ["New York","London","Berlin","Paris","Tokyo","Toronto","Sydney","Amsterdam"];

function personName() {
  const first = rand(FIRST_NAMES), last = rand(LAST_NAMES);
  return { first, last, name: `${first} ${last}`, email: `${first.toLowerCase()}.${last.toLowerCase()}@${rand(DOMAINS)}` };
}

// ── Users → Orders ───────────────────────────────────────────────────────
const PRODUCTS = ["Wireless Mouse","Mechanical Keyboard","USB-C Hub","Laptop Stand","Webcam","Monitor Arm","Desk Lamp","Noise-Cancelling Headphones","Portable SSD","Ergonomic Chair"];
const ORDER_STATUSES = ["pending","shipped","delivered","cancelled","refunded"];

// ── Authors → Books ───────────────────────────────────────────────────────
const TITLE_WORDS = ["Shadow","Echo","Silent","Last","Hidden","Golden","Broken","Eternal","Whispering","Forgotten"];
const TITLE_NOUNS = ["Garden","River","Kingdom","Storm","Path","Mirror","City","Flame","Horizon","Legacy"];
const GENRES = ["Fiction","Non-fiction","Sci-Fi","Fantasy","Mystery","Biography","Self-Help","History"];
const COUNTRIES = ["US","UK","DE","FR","JP","CA","AU","NL"];

// ── Companies → Employees ────────────────────────────────────────────────
const COMPANY_WORDS = ["Nimbus","Vertex","Cobalt","Orbit","Lumen","Anchor","Quill","Delta","Granite","Beacon"];
const COMPANY_SUFFIXES = ["Labs","Systems","Group","Works","Solutions","Partners"];
const INDUSTRIES = ["Software","Finance","Healthcare","Retail","Manufacturing","Logistics","Education","Energy"];
const JOB_ROLES = ["Engineer","Designer","Product Manager","Sales Rep","Support Specialist","Analyst","Recruiter","Accountant"];

interface RelationPreset {
  key: string;
  label: string; labelRu: string;
  parentTable: string; parentTableRu: string;
  childTable: string; childTableRu: string;
  fkField: string;
  genParent: (id: number) => Row;
  genChild: (id: number, parentId: number) => Row;
}

const PRESETS: RelationPreset[] = [
  {
    key: "users-orders",
    label: "Users → Orders", labelRu: "Пользователи → Заказы",
    parentTable: "users", parentTableRu: "users",
    childTable: "orders", childTableRu: "orders",
    fkField: "user_id",
    genParent: (id) => { const p = personName(); return { id, name: p.name, email: p.email, city: rand(CITIES), created_at: randDate() }; },
    genChild: (id, parentId) => ({
      id, user_id: parentId, product: rand(PRODUCTS), quantity: randInt(1, 5),
      price: parseFloat((Math.random() * 200 + 5).toFixed(2)), status: rand(ORDER_STATUSES), ordered_at: randDate(1),
    }),
  },
  {
    key: "authors-books",
    label: "Authors → Books", labelRu: "Авторы → Книги",
    parentTable: "authors", parentTableRu: "authors",
    childTable: "books", childTableRu: "books",
    fkField: "author_id",
    genParent: (id) => { const p = personName(); return { id, name: p.name, email: p.email, country: rand(COUNTRIES) }; },
    genChild: (id, parentId) => ({
      id, author_id: parentId, title: `The ${rand(TITLE_WORDS)} ${rand(TITLE_NOUNS)}`, genre: rand(GENRES),
      pages: randInt(120, 640), published_at: randDate(15),
    }),
  },
  {
    key: "companies-employees",
    label: "Companies → Employees", labelRu: "Компании → Сотрудники",
    parentTable: "companies", parentTableRu: "companies",
    childTable: "employees", childTableRu: "employees",
    fkField: "company_id",
    genParent: (id) => ({ id, name: `${rand(COMPANY_WORDS)} ${rand(COMPANY_SUFFIXES)}`, industry: rand(INDUSTRIES), city: rand(CITIES) }),
    genChild: (id, parentId) => {
      const p = personName();
      return { id, company_id: parentId, name: p.name, email: p.email, role: rand(JOB_ROLES), hired_at: randDate(6) };
    },
  },
];

function toCsv(rows: Row[], fields: string[]): string {
  return [fields.join(","), ...rows.map((r) => fields.map((f) => JSON.stringify(r[f] ?? "")).join(","))].join("\n");
}

export function RelationalTestDataGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Скопировать";
  const [presetKey, setPresetKey] = useState(PRESETS[0].key);
  const [parentCount, setParentCount] = useState(4);
  const [minChildren, setMinChildren] = useState(0);
  const [maxChildren, setMaxChildren] = useState(3);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [parents, setParents] = useState<Row[]>([]);
  const [children, setChildren] = useState<Row[]>([]);

  const preset = PRESETS.find((p) => p.key === presetKey)!;

  function generate() {
    const newParents: Row[] = [];
    const newChildren: Row[] = [];
    let childId = 1;
    for (let i = 1; i <= parentCount; i++) {
      newParents.push(preset.genParent(i));
      const n = randInt(Math.min(minChildren, maxChildren), Math.max(minChildren, maxChildren));
      for (let j = 0; j < n; j++) {
        newChildren.push(preset.genChild(childId, i));
        childId++;
      }
    }
    setParents(newParents);
    setChildren(newChildren);
  }

  const hasOutput = parents.length > 0;
  const parentFields = hasOutput ? Object.keys(parents[0]) : [];
  const childFields  = children.length > 0 ? Object.keys(children[0]) : [];
  const orphanCount  = parents.filter((p) => !children.some((c) => c[preset.fkField] === p.id)).length;

  const jsonOutput = hasOutput
    ? JSON.stringify({ [preset.parentTable]: parents, [preset.childTable]: children }, null, 2)
    : "";
  const parentCsv = hasOutput ? toCsv(parents, parentFields) : "";
  const childCsv  = children.length > 0 ? toCsv(children, childFields) : "";

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <label className="input-label">{isRu ? "Схема связи" : "Relation"}</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPresetKey(p.key)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${presetKey === p.key ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? p.labelRu : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="input-label">{isRu ? `Кол-во (${preset.parentTable})` : `Parent rows (${preset.parentTable})`}</label>
          <input type="number" value={parentCount} onChange={(e) => setParentCount(Math.min(20, Math.max(1, Number(e.target.value))))}
            min={1} max={20} className="code-surface w-24 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Мин. детей" : "Min children"}</label>
          <input type="number" value={minChildren} onChange={(e) => setMinChildren(Math.min(10, Math.max(0, Number(e.target.value))))}
            min={0} max={10} className="code-surface w-20 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Макс. детей" : "Max children"}</label>
          <input type="number" value={maxChildren} onChange={(e) => setMaxChildren(Math.min(10, Math.max(0, Number(e.target.value))))}
            min={0} max={10} className="code-surface w-20 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
        </div>
        <div className="flex rounded border border-border overflow-hidden">
          {(["json", "csv"] as const).map((f) => (
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
      <p className="text-[11px] text-text-muted -mt-2">
        {isRu
          ? `У каждой родительской записи случайное число детей от «мин» до «макс» — при мин. 0 часть записей останется без детей (${preset.parentTableRu}.${"id"} без ${preset.childTableRu}.${preset.fkField}), удобно для проверки пустых состояний.`
          : `Each parent gets a random number of children between min and max — with min 0, some parents end up with none (a ${preset.parentTable} with no matching ${preset.childTable}), useful for testing empty states.`}
      </p>

      {/* Output */}
      {hasOutput && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span>{parents.length} {preset.parentTable}</span>
            <span>{children.length} {preset.childTable}</span>
            <span>{orphanCount} {isRu ? `${preset.parentTable} без ${preset.childTable}` : `${preset.parentTable} with no ${preset.childTable}`}</span>
          </div>

          {format === "json" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">{isRu ? "Результат (JSON)" : "Result (JSON)"}</label>
                <CopyButton value={jsonOutput} />
              </div>
              <textarea readOnly value={jsonOutput} rows={16} spellCheck={false}
                className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">{preset.parentTable}.csv</label>
                  <CopyButton value={parentCsv} />
                </div>
                <textarea readOnly value={parentCsv} rows={12} spellCheck={false}
                  className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">{preset.childTable}.csv</label>
                  <CopyButton value={childCsv} />
                </div>
                <textarea readOnly value={childCsv} rows={12} spellCheck={false}
                  className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
