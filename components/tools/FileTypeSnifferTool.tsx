"use client";
import { useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { analyzeFile, hexDump, Sniffed } from "@/lib/messenger/file-sniff";
import { Finding } from "@/lib/mobile/findings";
import { FindingsList } from "./mobile/FindingsList";
import { Field, inputClass } from "./messenger/ui";

interface Result { name: string; size: number; declared: string; sniffed: Sniffed | null; findings: Finding[]; hex: string }

export function FileTypeSnifferTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [r, setR] = useState<Result | null>(null);

  const onFile = async (file: File | null) => {
    if (!file) { setR(null); return; }
    const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    const a = analyzeFile(file.name, file.type, head);
    setR({ name: file.name, size: file.size, declared: file.type, sniffed: a.sniffed, findings: a.findings, hex: hexDump(head, 32) });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="fz-file" label={isRu ? "Файл для проверки" : "File to inspect"} hint={isRu ? "Читаются только первые 4 КБ, файл никуда не отправляется." : "Only the first 4 KB are read and the file is never uploaded."}>
        <input id="fz-file" type="file" data-testid="fz-file" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} className={inputClass} />
      </Field>
      {r ? (
        <div className="space-y-4" data-testid="fz-result">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">{isRu ? "Имя" : "Name"}</dt><dd className="break-all font-mono" data-testid="fz-name">{r.name}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">{isRu ? "Размер" : "Size"}</dt><dd className="font-mono" data-testid="fz-size">{r.size} B</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">{isRu ? "Тип от браузера" : "Type from the browser"}</dt><dd className="font-mono" data-testid="fz-declared">{r.declared || "(empty)"}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">{isRu ? "Тип по содержимому" : "Type from the content"}</dt><dd className="font-mono" data-testid="fz-type" data-type={r.sniffed?.type ?? ""}>{r.sniffed ? `${r.sniffed.type} (${r.sniffed.mime})` : (isRu ? "не определён" : "unknown")}</dd></div>
          </dl>
          <div>
            <h3 className="input-label">{isRu ? "Первые байты" : "First bytes"}</h3>
            <pre className="code-surface overflow-x-auto rounded-lg px-3 py-2 font-mono text-xs" data-testid="fz-hex">{r.hex || "-"}</pre>
          </div>
          <FindingsList findings={r.findings} isRu={isRu} testId="fz-findings" />
        </div>
      ) : <p className="text-sm text-text-muted" data-testid="fz-empty">{isRu ? "Выберите файл." : "Choose a file."}</p>}
    </div>
  );
}
