"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePinnedCases } from "@/lib/hooks/usePinnedCases";

/**
 * Test Vault — кнопка "закрепить как тест-кейс", вставляется в
 * инструменты по одной строке (см. components/tools/JsonFormatterTool.tsx,
 * JwtDecoderTool.tsx, RegexTesterTool.tsx). Каждый инструмент сам решает,
 * когда есть валидный результат, который стоит закреплять — рендерит
 * кнопку только тогда, передавая getCase(), вызываемый в момент клика
 * "Сохранить", а не заранее, чтобы всегда закреплялся текущий ввод/вывод.
 */
export function PinCaseButton({
  toolSlug,
  isRu,
  getCase,
}: {
  toolSlug: string;
  isRu: boolean;
  getCase: () => { input: unknown; output: unknown };
}) {
  const { pin, atLimit } = usePinnedCases();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const { input, output } = getCase();
    const ok = await pin({
      tool_slug: toolSlug,
      label: label.trim(),
      input_payload: input,
      expected_output: output,
    });
    setSaving(false);
    if (ok) {
      setOpen(false);
      setLabel("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={justSaved}
      >
        {justSaved
          ? (isRu ? "Закреплено ✓" : "Pinned ✓")
          : (isRu ? "Закрепить как тест-кейс" : "Pin as test case")}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-border bg-canvas p-3 shadow-lg">
          {atLimit ? (
            <p className="text-xs text-amber-400">
              {isRu
                ? `Достигнут лимит Test Vault. Удали что-нибудь в /vault, чтобы закрепить новое.`
                : `Test Vault is full. Remove something in /vault to pin a new one.`}
            </p>
          ) : (
            <>
              <label className="input-label">{isRu ? "Метка (необязательно)" : "Label (optional)"}</label>
              <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder={isRu ? "например: expired nested claims" : "e.g. expired nested claims"}
                className="code-surface w-full rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none"
              />
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs text-text-muted transition-colors hover:text-text-primary"
                >
                  {isRu ? "Отмена" : "Cancel"}
                </button>
                <Button type="button" size="sm" disabled={saving} onClick={handleSave}>
                  {saving ? (isRu ? "Сохраняю..." : "Saving...") : (isRu ? "Сохранить" : "Save")}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
