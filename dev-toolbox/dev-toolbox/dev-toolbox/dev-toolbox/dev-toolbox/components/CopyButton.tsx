"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useDict } from "@/lib/i18n/dict-context";

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M11 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function CopyButton({ value, label, copiedLabel, iconOnly=false, className="" }:
  { value:string; label?:string; copiedLabel?:string; iconOnly?:boolean; className?:string; }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();
  const { dict } = useDict();
  const copyText   = label       ?? dict.common.copy;
  const copiedText = copiedLabel ?? dict.common.copied;

  async function handleCopy() {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); }
    catch {
      const el = Object.assign(document.createElement("textarea"),{value});
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); success(copiedText); setTimeout(()=>setCopied(false),1500);
  }

  if (iconOnly) return (
    <button type="button" onClick={handleCopy} disabled={!value}
      aria-label={copied?copiedText:copyText} title={copied?copiedText:copyText}
      className={`rounded-[8px] p-1.5 transition-all duration-150 disabled:opacity-40 ${copied?"text-accent":"text-text-muted hover:bg-surface hover:text-text-primary"} ${className}`}>
      {copied?<CheckIcon/>:<CopyIcon/>}
    </button>
  );

  return (
    <button type="button" onClick={handleCopy} disabled={!value}
      className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-sm font-medium transition-all duration-150 disabled:opacity-40
        ${copied?"border-accent/40 bg-accent/10 text-accent":"border-border bg-surface text-text-muted hover:bg-surface-hover hover:text-text-primary"} ${className}`}>
      {copied?<CheckIcon/>:<CopyIcon/>} {copied?copiedText:copyText}
    </button>
  );
}
