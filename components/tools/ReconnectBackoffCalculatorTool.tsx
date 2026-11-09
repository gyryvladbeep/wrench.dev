"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { JitterMode, backoffTable, firstCappedAttempt, fmtMs } from "@/lib/messenger/backoff";
import { Field, NumberField, Panel, Stat, inputClass } from "./messenger/ui";

export function ReconnectBackoffCalculatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [base, setBase] = useState("1000");
  const [factor, setFactor] = useState("2");
  const [max, setMax] = useState("30000");
  const [attempts, setAttempts] = useState("8");
  const [jitter, setJitter] = useState<JitterMode>("none");
  const [seed, setSeed] = useState("1");

  const input = { baseMs: Number(base), factor: Number(factor), maxMs: Number(max), attempts: Math.min(50, Math.floor(Number(attempts))), jitter, seed: Number(seed) || 1 };
  const valid = input.baseMs > 0 && input.factor >= 1 && input.maxMs >= input.baseMs && input.attempts >= 1;
  const rows = useMemo(() => (valid ? backoffTable(input) : []), [valid, input.baseMs, input.factor, input.maxMs, input.attempts, input.jitter, input.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const capped = firstCappedAttempt(rows);
  const last = rows[rows.length - 1];

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-3">
        <NumberField id="bo-base" label={isRu ? "Начальная задержка, мс" : "Base delay, ms"} value={base} onChange={setBase} min={1} />
        <NumberField id="bo-factor" label={isRu ? "Множитель" : "Factor"} value={factor} onChange={setFactor} min={1} step="0.1" />
        <NumberField id="bo-max" label={isRu ? "Максимальная задержка, мс" : "Max delay, ms"} value={max} onChange={setMax} min={1} />
        <NumberField id="bo-attempts" label={isRu ? "Число попыток" : "Attempts"} value={attempts} onChange={setAttempts} min={1} max={50} />
        <Field id="bo-jitter" label="Jitter">
          <select id="bo-jitter" value={jitter} onChange={(e) => setJitter(e.target.value as JitterMode)} className={inputClass}>
            <option value="none">{isRu ? "Нет" : "None"}</option>
            <option value="full">Full</option>
            <option value="equal">Equal</option>
            <option value="decorrelated">Decorrelated</option>
          </select>
        </Field>
        <NumberField id="bo-seed" label={isRu ? "Seed примера" : "Sample seed"} value={seed} onChange={setSeed} />
      </Panel>
      {!valid ? (
        <p className="text-sm text-text-muted" data-testid="bo-invalid">{isRu ? "Задержка должна быть положительной, множитель не меньше 1, максимум не меньше начальной задержки." : "Delay must be positive, the factor at least 1, and the max at least the base delay."}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat id="bo-capped" label={isRu ? "Упирается в максимум с попытки" : "Hits the cap at attempt"} value={capped ?? "-"} />
            <Stat id="bo-total-max" label={isRu ? "Худший случай суммарно" : "Worst case total"} value={last ? fmtMs(last.cumulativeMaxMs) : "-"} />
            <Stat id="bo-total-min" label={isRu ? "Лучший случай суммарно" : "Best case total"} value={last ? fmtMs(last.cumulativeMinMs) : "-"} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="bo-table">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2 font-medium">{isRu ? "Попытка" : "Attempt"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Номинал" : "Nominal"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Диапазон" : "Range"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Пример" : "Sample"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Накоплено (макс.)" : "Cumulative (max)"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.attempt} data-attempt={r.attempt} data-nominal={r.nominalMs} data-capped={r.capped} className="border-t border-border">
                    <td className="px-3 py-1.5">{r.attempt}</td>
                    <td className="px-3 py-1.5 font-mono">{fmtMs(r.nominalMs)}{r.capped ? " (cap)" : ""}</td>
                    <td className="px-3 py-1.5 font-mono">{fmtMs(r.minMs)} - {fmtMs(r.maxMs)}</td>
                    <td className="px-3 py-1.5 font-mono">{fmtMs(r.sampleMs)}</td>
                    <td className="px-3 py-1.5 font-mono">{fmtMs(r.cumulativeMaxMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted">{isRu ? "Без jitter тысячи клиентов, потерявших соединение одновременно, переподключатся одновременно. Проверьте, что клиент мессенджера делает паузы именно такой длины и не превышает максимум." : "Without jitter, thousands of clients that lost the connection together reconnect together. Check that the messenger client waits exactly this long and never exceeds the cap."}</p>
        </>
      )}
    </div>
  );
}
