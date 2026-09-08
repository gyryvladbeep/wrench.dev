"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface Row { id: string; name: string; weight: number; }

let nextId = 0;
function newRow(name: string, weight: number): Row {
  nextId += 1;
  return { id: `row-${nextId}`, name, weight };
}

const DEFAULT_ROWS: Row[] = [
  newRow("Common", 70),
  newRow("Rare", 25),
  newRow("Epic", 4),
  newRow("Legendary", 1),
];

interface SimResult { id: string; name: string; weight: number; expectedPct: number; simulatedPct: number; count: number; }

function runSimulation(rows: Row[], rolls: number): SimResult[] {
  const valid = rows.filter(r => r.weight > 0 && r.name.trim() !== "");
  const total = valid.reduce((s, r) => s + r.weight, 0);
  if (total <= 0 || rolls <= 0) return [];

  // Cumulative-weight buckets for weighted random selection.
  const cumulative: { row: Row; upTo: number }[] = [];
  let running = 0;
  for (const r of valid) {
    running += r.weight;
    cumulative.push({ row: r, upTo: running });
  }

  const counts = new Map<string, number>();
  for (let i = 0; i < rolls; i++) {
    const roll = Math.random() * total;
    const bucket = cumulative.find(c => roll < c.upTo) ?? cumulative[cumulative.length - 1];
    counts.set(bucket.row.id, (counts.get(bucket.row.id) ?? 0) + 1);
  }

  return valid.map(r => ({
    id: r.id,
    name: r.name,
    weight: r.weight,
    expectedPct: (r.weight / total) * 100,
    count: counts.get(r.id) ?? 0,
    simulatedPct: ((counts.get(r.id) ?? 0) / rolls) * 100,
  }));
}

export function LootTableValidatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [rollCount, setRollCount] = useState(10000);
  const [results, setResults] = useState<SimResult[] | null>(null);

  const totalWeight = useMemo(() => rows.reduce((s, r) => s + (r.weight > 0 ? r.weight : 0), 0), [rows]);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));
    setResults(null);
  }

  function addRow() {
    setRows(rs => [...rs, newRow(isRu ? "Новый предмет" : "New item", 10)]);
    setResults(null);
  }

  function removeRow(id: string) {
    setRows(rs => rs.filter(r => r.id !== id));
    setResults(null);
  }

  function simulate() {
    setResults(runSimulation(rows, rollCount));
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="space-y-2">
        <label className="input-label">{isRu ? "Таблица лута" : "Loot table"}</label>
        {rows.map(r => (
          <div key={r.id} className="flex gap-2 items-center">
            <input value={r.name} onChange={e => updateRow(r.id, { name: e.target.value })}
              placeholder={isRu ? "Название предмета" : "Item name"}
              className="code-surface flex-1 rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
            <input type="number" min={0} value={r.weight} onChange={e => updateRow(r.id, { weight: Number(e.target.value) })}
              className="code-surface w-24 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
            <button onClick={() => removeRow(r.id)} title={isRu ? "Удалить" : "Remove"}
              className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-2 text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addRow}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
          + {isRu ? "Добавить предмет" : "Add item"}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="input-label">{isRu ? "Число роллов" : "Roll count"}</label>
          <input type="number" min={1} value={rollCount} onChange={e => { setRollCount(Number(e.target.value)); setResults(null); }}
            className="code-surface w-32 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
        </div>
        <button onClick={simulate} disabled={totalWeight <= 0 || rollCount <= 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {isRu ? "Запустить симуляцию" : "Run simulation"}
        </button>
        <span className="text-xs text-text-muted">
          {isRu ? "Суммарный вес" : "Total weight"}: {totalWeight}
        </span>
      </div>

      {results && results.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted">
              <th className="py-1.5 font-normal">{isRu ? "Предмет" : "Item"}</th>
              <th className="py-1.5 font-normal">{isRu ? "Ожидается %" : "Expected %"}</th>
              <th className="py-1.5 font-normal">{isRu ? "Симуляция %" : "Simulated %"}</th>
              <th className="py-1.5 font-normal">{isRu ? "Выпало раз" : "Rolled"}</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => {
              const delta = Math.abs(r.simulatedPct - r.expectedPct);
              const flagged = delta > 1 && rollCount >= 5000;
              return (
                <tr key={r.id} className={`border-t border-border/60 ${flagged ? "bg-amber-500/5" : ""}`}>
                  <td className="py-1.5 text-text-primary">{r.name}</td>
                  <td className="py-1.5 font-mono text-text-primary">{r.expectedPct.toFixed(2)}%</td>
                  <td className="py-1.5 font-mono text-text-primary">{r.simulatedPct.toFixed(2)}%</td>
                  <td className="py-1.5 font-mono text-text-muted">{r.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
