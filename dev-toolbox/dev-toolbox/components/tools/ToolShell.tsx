"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDict } from "@/lib/i18n/dict-context";

interface ToolShellProps {
  onClear?: () => void;
  onRun?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  showKbd?: boolean;
}

export function ToolShell({ onClear, onRun, actions, children, showKbd=true }: ToolShellProps) {
  const { locale } = useDict();
  const isRu = locale === "ru";

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.ctrlKey||e.metaKey) && e.key==="Enter")  { e.preventDefault(); onRun?.(); }
      if ((e.ctrlKey||e.metaKey) && e.shiftKey && e.key==="X") { e.preventDefault(); onClear?.(); }
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onRun, onClear]);

  return (
    <div className="flex flex-col gap-4">
      {(actions || onClear) && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto text-text-muted">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              {isRu ? "Очистить" : "Clear"}
            </Button>
          )}
        </div>
      )}
      {children}
      {showKbd && (onRun||onClear) && (
        <div className="flex gap-4 border-t border-border pt-3 text-xs text-text-muted">
          {onRun   && <span><kbd className="rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[10px]">⌘↵</kbd> {isRu?"выполнить":"run"}</span>}
          {onClear && <span><kbd className="rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[10px]">⌘⇧X</kbd> {isRu?"очистить":"clear"}</span>}
        </div>
      )}
    </div>
  );
}
