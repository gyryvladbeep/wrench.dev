"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const PRESETS = [
  { label: "Every minute",        labelRu: "Каждую минуту",       cron: "* * * * *" },
  { label: "Every hour",          labelRu: "Каждый час",          cron: "0 * * * *" },
  { label: "Every day at noon",   labelRu: "Каждый день в полдень", cron: "0 12 * * *" },
  { label: "Every Monday 9am",    labelRu: "Каждый пн в 9:00",    cron: "0 9 * * 1" },
  { label: "Every weekday 8am",   labelRu: "Будни в 8:00",        cron: "0 8 * * 1-5" },
  { label: "Every Sunday midnight", labelRu: "Вс в полночь",      cron: "0 0 * * 0" },
  { label: "First of month",      labelRu: "1-е число месяца",    cron: "0 0 1 * *" },
  { label: "Every 15 minutes",    labelRu: "Каждые 15 минут",     cron: "*/15 * * * *" },
  { label: "Every 6 hours",       labelRu: "Каждые 6 часов",      cron: "0 */6 * * *" },
  { label: "Twice a day",         labelRu: "Дважды в день",       cron: "0 8,20 * * *" },
];

const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function parsePart(part: string, min: number, max: number): number[] {
  const values: number[] = [];
  if (part === "*") { for (let i=min;i<=max;i++) values.push(i); return values; }
  for (const seg of part.split(",")) {
    if (seg.includes("/")) {
      const [range, step] = seg.split("/");
      const s = Number(step);
      const [start, end] = range === "*" ? [min,max] : range.split("-").map(Number);
      for (let i=start;i<=(end??max);i+=s) values.push(i);
    } else if (seg.includes("-")) {
      const [start,end] = seg.split("-").map(Number);
      for (let i=start;i<=end;i++) values.push(i);
    } else {
      values.push(Number(seg));
    }
  }
  return values.filter((v) => v>=min && v<=max);
}

function describeCron(cron: string, isRu: boolean): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return isRu ? "Неверный формат" : "Invalid format";
  const [min, hour, dom, month, dow] = parts;

  const every  = isRu ? "каждую" : "every";
  const everyH = isRu ? "каждый час" : "every hour";
  const at     = isRu ? "в" : "at";

  if (cron === "* * * * *") return isRu ? "Каждую минуту" : "Every minute";
  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && dow === "*") {
    const h = parsePart(hour, 0, 23).join(", ");
    return isRu ? `Каждый день в ${h}:00` : `Every day at ${h}:00`;
  }
  if (min.startsWith("*/")) {
    return isRu ? `Каждые ${min.split("/")[1]} минут` : `Every ${min.split("/")[1]} minutes`;
  }
  if (hour.startsWith("*/")) {
    return isRu ? `Каждые ${hour.split("/")[1]} часов` : `Every ${hour.split("/")[1]} hours`;
  }
  if (dow !== "*") {
    const days = parsePart(dow, 0, 6).map((d) => WEEKDAYS[d]).join(", ");
    const h = hour === "*" ? everyH : `${at} ${parsePart(hour,0,23).join(",")}:${parsePart(min,0,59).join(",").padStart(2,"0")}`;
    return isRu ? `По ${days} ${h}` : `Every ${days} ${h}`;
  }
  if (dom !== "*") {
    const d = parsePart(dom, 1, 31).join(", ");
    const h = `${parsePart(hour,0,23).join(",")}:${parsePart(min,0,59).join(",").padStart(2,"0")}`;
    return isRu ? `${d}-го числа каждого месяца в ${h}` : `Day ${d} of every month at ${h}`;
  }

  return isRu ? "Расписание задано" : "Schedule defined";
}

function nextRuns(cron: string, count = 5): Date[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const [minP, hourP, domP, , dowP] = parts;
  const results: Date[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);

  let attempts = 0;
  while (results.length < count && attempts++ < 10000) {
    const mins = parsePart(minP, 0, 59);
    const hours = parsePart(hourP, 0, 23);
    const doms = parsePart(domP, 1, 31);
    const dows = parsePart(dowP, 0, 6);

    const domOk = domP === "*" || doms.includes(now.getDate());
    const dowOk = dowP === "*" || dows.includes(now.getDay());
    const hourOk = hours.includes(now.getHours());
    const minOk = mins.includes(now.getMinutes());

    if (domOk && dowOk && hourOk && minOk) {
      results.push(new Date(now));
    }
    now.setMinutes(now.getMinutes() + 1);
  }
  return results;
}

export function CronExpressionTool({ dict }: { dict: Dictionary }) {
  const [cron, setCron] = useState("0 9 * * 1-5");
  const isRu = dict.common.copy === "Копировать";

  const parts  = cron.trim().split(/\s+/);
  const valid  = parts.length === 5 && parts.every((p) => /^[\d\*\/\-,]+$/.test(p));
  const desc   = useMemo(() => valid ? describeCron(cron, isRu) : (isRu ? "Неверный формат" : "Invalid format"), [cron, valid, isRu]);
  const runs   = useMemo(() => valid ? nextRuns(cron) : [], [cron, valid]);
  const labels = isRu ? ["минута","час","день","месяц","день нед."] : ["minute","hour","day","month","weekday"];

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <label className="input-label">{isRu ? "Быстрый выбор" : "Presets"}</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.cron} onClick={() => setCron(p.cron)}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${cron === p.cron ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? p.labelRu : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expression input */}
      <div>
        <label className="input-label">{isRu ? "Cron-выражение" : "Cron expression"}</label>
        <div className="flex gap-2">
          <input value={cron} onChange={(e) => setCron(e.target.value)} spellCheck={false}
            className={`code-surface flex-1 rounded-lg px-3 py-2.5 font-mono text-lg text-text-primary outline-none ${!valid && cron ? "border-red-500/50" : ""}`} />
          <CopyButton value={cron} />
        </div>
        {/* Field labels */}
        <div className="mt-1.5 grid grid-cols-5 gap-1 px-1">
          {parts.slice(0,5).map((part, i) => (
            <div key={i} className="text-center">
              <div className="rounded bg-surface border border-border px-1 py-1 font-mono text-sm text-accent">{part}</div>
              <div className="mt-0.5 text-[10px] text-text-muted">{labels[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className={`rounded-lg border px-4 py-3 ${valid ? "border-accent/30 bg-accent/5" : "border-red-800/40 bg-red-900/10"}`}>
        <p className={`text-sm font-medium ${valid ? "text-accent" : "text-red-400"}`}>{desc}</p>
      </div>

      {/* Next runs */}
      {runs.length > 0 && (
        <div>
          <label className="input-label">{isRu ? "Следующие запуски" : "Next runs"}</label>
          <div className="space-y-1">
            {runs.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
                <span className="text-[10px] font-medium text-text-muted w-6">{i+1}</span>
                <span className="font-mono text-sm text-text-primary">{d.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-semibold text-text-secondary">{isRu ? "Синтаксис" : "Syntax reference"}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-text-muted font-mono">
          {[["*","any value"],["*/5","every 5"],["1-5","range 1 to 5"],["1,3,5","1, 3 and 5"]].map(([sym, desc]) => (
            <div key={sym} className="flex gap-2"><span className="text-accent w-10">{sym}</span><span>{desc}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
