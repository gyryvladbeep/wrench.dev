"use client";
import { useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { FILE_KINDS, FileKind, MAX_FILE_BYTES, NAME_PRESETS, boundarySizes, buildFile, clampSize, humanBytes } from "@/lib/messenger/test-files";
import { btnClass, download, primaryBtn, Field, NumberField, Panel, Stat, inputClass } from "./messenger/ui";

const UNITS = { B: 1, KB: 1024, MB: 1024 * 1024 } as const;
type Unit = keyof typeof UNITS;

export function TestFileGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [kind, setKind] = useState<FileKind>("zero");
  const [size, setSize] = useState("5");
  const [unit, setUnit] = useState<Unit>("MB");
  const [name, setName] = useState("test-file.bin");
  const [limit, setLimit] = useState("5");
  const [limitUnit, setLimitUnit] = useState<Unit>("MB");

  const meta = FILE_KINDS.find((k) => k.id === kind)!;
  const bytes = clampSize(Number(size) * UNITS[unit]);
  const tooBig = Number(size) * UNITS[unit] > MAX_FILE_BYTES;
  const limitBytes = clampSize(Number(limit) * UNITS[limitUnit]);

  const make = (n: number, fileName: string) => download(fileName, buildFile(kind, n) as BlobPart, meta.mime);
  const withSuffix = (suffix: string) => name.replace(/(\.[^.]*)?$/, `-${suffix}$1`);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-2">
        <Field id="tf-kind" label={isRu ? "Тип файла" : "File type"}>
          <select id="tf-kind" value={kind} onChange={(e) => {
            const k = e.target.value as FileKind;
            setKind(k);
            const m = FILE_KINDS.find((x) => x.id === k)!;
            setName((n) => n.replace(/\.[^.]*$/, "") + "." + m.ext);
          }} className={inputClass}>
            {FILE_KINDS.map((k) => <option key={k.id} value={k.id}>{isRu ? k.labelRu : k.labelEn}</option>)}
          </select>
        </Field>
        <Field id="tf-name" label={isRu ? "Имя файла" : "File name"}>
          <input id="tf-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <NumberField id="tf-size" label={isRu ? "Размер" : "Size"} value={size} onChange={setSize} min={0} />
        <Field id="tf-unit" label={isRu ? "Единицы" : "Unit"}>
          <select id="tf-unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={inputClass}>
            <option value="B">B</option><option value="KB">KB (1024 B)</option><option value="MB">MB (1048576 B)</option>
          </select>
        </Field>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat id="tf-bytes" label={isRu ? "Итого, байт" : "Total, bytes"} value={bytes} />
        <Stat id="tf-human" label={isRu ? "Размер" : "Size"} value={humanBytes(bytes)} />
      </div>
      {tooBig ? <p className="text-sm text-amber-300" data-testid="tf-clamped">{isRu ? "Размер ограничен 200 МБ: файл собирается в памяти браузера." : "Size is capped at 200 MB because the file is built in browser memory."}</p> : null}
      <button type="button" data-testid="tf-download" className={primaryBtn} onClick={() => make(bytes, name || "test-file")}>
        {isRu ? "Скачать файл" : "Download file"}
      </button>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">{isRu ? "Граница лимита" : "Limit boundary"}</h3>
        <Panel cols="sm:grid-cols-2">
          <NumberField id="tf-limit" label={isRu ? "Лимит размера вложения" : "Attachment size limit"} value={limit} onChange={setLimit} min={0} />
          <Field id="tf-limit-unit" label={isRu ? "Единицы лимита" : "Limit unit"}>
            <select id="tf-limit-unit" value={limitUnit} onChange={(e) => setLimitUnit(e.target.value as Unit)} className={inputClass}>
              <option value="B">B</option><option value="KB">KB</option><option value="MB">MB</option>
            </select>
          </Field>
        </Panel>
        <ul className="grid gap-2 sm:grid-cols-3" data-testid="tf-boundary">
          {boundarySizes(limitBytes).map((b, i) => (
            <li key={b.label} data-bytes={b.bytes} className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="text-text-muted">{b.label}</div>
              <div className="mb-2 font-mono">{b.bytes} B</div>
              <button type="button" className={btnClass} data-testid={`tf-boundary-${i}`} onClick={() => make(b.bytes, withSuffix(String(b.bytes)))}>{isRu ? "Скачать" : "Download"}</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">{isRu ? "Трудные имена файлов" : "Tricky file names"}</h3>
        <ul className="grid gap-2 sm:grid-cols-2" data-testid="tf-names">
          {NAME_PRESETS.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="min-w-0"><span className="block truncate font-mono" title={p.name}>{p.name.length > 40 ? p.name.slice(0, 37) + "..." : p.name}</span><span className="text-xs text-text-muted">{isRu ? p.noteRu : p.noteEn}</span></span>
              <button type="button" className={btnClass} data-testid={`tf-name-${p.id}`} onClick={() => setName(p.name)}>{isRu ? "Подставить" : "Use"}</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
