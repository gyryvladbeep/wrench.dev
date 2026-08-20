"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const PERMS = [
  { label: "Read",    bit: 4, sym: "r" },
  { label: "Write",   bit: 2, sym: "w" },
  { label: "Execute", bit: 1, sym: "x" },
];

interface PermSet { read: boolean; write: boolean; execute: boolean; }

export function ChmodCalculatorTool({ dict }: { dict: Dictionary }) {
  const [owner, setOwner] = useState<PermSet>({ read:true,  write:true,  execute:false });
  const [group, setGroup] = useState<PermSet>({ read:true,  write:false, execute:false });
  const [other, setOther] = useState<PermSet>({ read:true,  write:false, execute:false });
  const isRu = dict.common.copy === "Копировать";

  const calc = (p: PermSet) => (p.read?4:0)+(p.write?2:0)+(p.execute?1:0);

  const octal = useMemo(() => `${calc(owner)}${calc(group)}${calc(other)}`, [owner, group, other]);
  const symbolic = useMemo(() => {
    const sym = (p: PermSet) => `${p.read?"r":"-"}${p.write?"w":"-"}${p.execute?"x":"-"}`;
    return `-${sym(owner)}${sym(group)}${sym(other)}`;
  }, [owner, group, other]);

  const COMMON: { label: string; labelRu: string; val: string }[] = [
    { label:"755 — scripts/dirs",   labelRu:"755 — скрипты/папки",  val:"755" },
    { label:"644 — files",          labelRu:"644 — файлы",           val:"644" },
    { label:"700 — private",        labelRu:"700 — приватный",       val:"700" },
    { label:"777 — everyone (risky)",labelRu:"777 — все (опасно)",   val:"777" },
    { label:"600 — secret files",   labelRu:"600 — секретные файлы", val:"600" },
    { label:"664 — group write",    labelRu:"664 — запись группе",   val:"664" },
  ];

  function applyOctal(val: string) {
    if (val.length !== 3) return;
    const parse = (n: number): PermSet => ({ read:!!(n&4), write:!!(n&2), execute:!!(n&1) });
    setOwner(parse(Number(val[0])));
    setGroup(parse(Number(val[1])));
    setOther(parse(Number(val[2])));
  }

  const PermRow = ({ label, labelRu, perm, setPerm }: { label:string; labelRu:string; perm:PermSet; setPerm:(p:PermSet)=>void }) => (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="w-20 text-sm font-medium text-text-primary">{isRu ? labelRu : label}</span>
      <div className="flex gap-4">
        {PERMS.map(({ label: pl, bit, sym }) => {
          const key = pl.toLowerCase() as keyof PermSet;
          return (
            <label key={pl} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input type="checkbox" checked={perm[key]} onChange={(e) => setPerm({ ...perm, [key]: e.target.checked })}
                className="accent-accent" />
              <span className={perm[key] ? "text-text-primary" : "text-text-disabled"}>{pl}</span>
              <span className={`font-mono text-xs ${perm[key] ? "text-accent" : "text-text-disabled"}`}>({sym})</span>
            </label>
          );
        })}
      </div>
      <div className="ml-auto font-mono text-2xl font-bold text-accent">{calc(perm)}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Common presets */}
      <div>
        <label className="input-label">{isRu ? "Быстрый выбор" : "Common presets"}</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON.map((c) => (
            <button key={c.val} onClick={() => applyOctal(c.val)}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${octal === c.val ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? c.labelRu : c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Permission rows */}
      <PermRow label="Owner (u)" labelRu="Владелец (u)" perm={owner} setPerm={setOwner} />
      <PermRow label="Group (g)" labelRu="Группа (g)"   perm={group} setPerm={setGroup} />
      <PermRow label="Others (o)" labelRu="Остальные (o)" perm={other} setPerm={setOther} />

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <p className="text-xs text-text-muted mb-1">{isRu ? "Восьмеричный" : "Octal"}</p>
          <p className="font-mono text-4xl font-bold text-accent">{octal}</p>
          <div className="mt-2"><CopyButton value={octal} /></div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <p className="text-xs text-text-muted mb-1">{isRu ? "Символьный" : "Symbolic"}</p>
          <p className="font-mono text-2xl font-bold text-text-primary">{symbolic}</p>
          <div className="mt-2"><CopyButton value={symbolic} /></div>
        </div>
      </div>

      {/* chmod command */}
      <div>
        <label className="input-label">chmod {isRu ? "команда" : "command"}</label>
        <div className="code-surface rounded-lg flex items-center justify-between px-4 py-2.5">
          <span className="font-mono text-sm text-text-primary">chmod {octal} filename</span>
          <CopyButton value={`chmod ${octal} filename`} />
        </div>
      </div>
    </div>
  );
}
