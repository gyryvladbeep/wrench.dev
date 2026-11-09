"use client";
import { ReactNode } from "react";

export const inputClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none";
export const areaClass = `${inputClass} min-h-[120px] resize-y`;
export const btnClass = "rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary";
export const btnActiveClass = "rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-medium text-text-primary";
export const primaryBtn = "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-amber-400 disabled:opacity-50";

export function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="input-label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}

export function NumberField({ id, label, value, onChange, min, max, step, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number | string; hint?: string }) {
  return (
    <Field id={id} label={label} hint={hint}>
      <input id={id} type="number" min={min} max={max} step={step ?? "any"} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </Field>
  );
}

export function Stat({ id, label, value }: { id: string; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2" data-testid={id}>
      <div className="text-[11px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="font-mono text-lg text-text-primary">{value}</div>
    </div>
  );
}

export function Panel({ children, cols }: { children: ReactNode; cols?: string }) {
  return <div className={`grid gap-3 rounded-lg border border-border bg-surface p-4 ${cols ?? ""}`}>{children}</div>;
}

export function download(name: string, data: BlobPart, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
