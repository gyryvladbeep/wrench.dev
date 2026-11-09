"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { localePath, Locale } from "@/lib/i18n/config";
import { MockEndpoint, RouteInput, ImportCollectionResult } from "@/lib/hooks/useMockEndpoints";
import { parseCollectionFile, ParseResult, ParsedRoute } from "@/lib/mock-api/parse-collection";
import { CloseIcon, UploadIcon, CheckIcon, WarningIcon } from "@/components/icons/GameIcons";

// ═══════════════════════════════════════════════════════════════
// Импорт коллекции Postman/Insomnia — вся "вау-логика" фичи
// ═══════════════════════════════════════════════════════════════
// Зачем это вообще нужно и почему это не просто галочка "для галочки":
// у любого QA/дева уже лежит на диске коллекция Postman/Insomnia под
// его текущий рабочий проект — не гипотетический пример из
// документации, а то, с чем он и так работает каждый день. Перетащил
// РЕАЛЬНЫЙ файл — через 10 секунд получил живые мок-эндпоинты, вместо
// получаса ручного ввода каждого route по отдельности.
//
// Честная оговорка, которую показывает этот модал: "из коробки" рабочим
// (без правки тела ответа руками) импорт получается только если в
// коллекции сохранены примеры ответа (Postman response examples) — этот
// факт на каждый route виден бейджем "пример"/"заглушка", а для
// Insomnia (которая примеры не экспортирует вовсе) — один общий баннер.
//
// Три шага: "pick" (выбрать файл) → "preview" (что нашли, что выбрать,
// куда сохранить) → "result" (что реально сохранилось).

type Step = "pick" | "preview" | "result";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — с запасом даже для очень больших коллекций

interface ImportCollectionModalProps {
  open: boolean;
  onClose: () => void;
  isRu: boolean;
  locale: Locale;
  endpoints: MockEndpoint[];
  maxEndpoints: number;
  maxRoutesPerEndpoint: number;
  isPro: boolean;
  onImport: (opts: { endpointId: string | null; newEndpointName?: string; routes: RouteInput[] }) => Promise<ImportCollectionResult>;
}

export function ImportCollectionModal({
  open, onClose, isRu, locale, endpoints, maxEndpoints, maxRoutesPerEndpoint, isPro, onImport,
}: ImportCollectionModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<string>("new");
  const [newName, setNewName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportCollectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreateNew = endpoints.length < maxEndpoints;

  // Сброс на каждое открытие — модал не размонтируется между открытиями
  // (родитель просто держит его в дереве), тот же приём, что уже принят
  // в ToolPickerModal.tsx.
  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setDragOver(false);
    setFileError(null);
    setParsed(null);
    setSelected(new Set());
    setResult(null);
    setTarget(canCreateNew ? "new" : (endpoints[0]?.id ?? "new"));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleFile(file: File) {
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError(isRu ? "Файл слишком большой (максимум 5МБ)." : "File is too large (5MB max).");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setFileError(isRu ? "Не удалось прочитать файл." : "Couldn't read the file.");
      return;
    }
    const res = parseCollectionFile(text);
    if (!res.ok) {
      setFileError(
        res.error === "empty"
          ? (isRu ? "Файл пустой." : "The file is empty.")
          : res.error === "invalid-json"
          ? (isRu ? "Это не валидный JSON." : "That's not valid JSON.")
          : (isRu
              ? "Не распознан формат — ожидается экспорт коллекции Postman (v2.0/v2.1) или Insomnia (v4), JSON."
              : "Unrecognized format — expected a Postman (v2.0/v2.1) or Insomnia (v4) collection export, JSON.")
      );
      return;
    }
    if (res.routes.length === 0) {
      setFileError(isRu
        ? `В «${res.collectionName}» не нашлось ни одного маршрута с поддерживаемым методом (GET/POST/PUT/PATCH/DELETE).`
        : `No routes with a supported method (GET/POST/PUT/PATCH/DELETE) found in "${res.collectionName}".`);
      return;
    }
    setParsed(res);
    setSelected(new Set(res.routes.map((_, i) => i)));
    setNewName(res.collectionName.slice(0, 60));
    setStep("preview");
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // тот же файл можно выбрать повторно после ошибки
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const targetCapacity = useMemo(() => {
    if (target === "new") return maxRoutesPerEndpoint;
    const ep = endpoints.find((e) => e.id === target);
    return ep ? Math.max(0, maxRoutesPerEndpoint - ep.mock_routes.length) : 0;
  }, [target, endpoints, maxRoutesPerEndpoint]);

  const selectedCount = selected.size;
  const overCapacity = selectedCount > targetCapacity;
  const exampleCount = parsed?.routes.filter((r) => r.hasExample).length ?? 0;

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function handleImport() {
    if (!parsed || selectedCount === 0 || overCapacity) return;
    setImporting(true);
    const routes: RouteInput[] = parsed.routes
      .filter((_, i) => selected.has(i))
      .map((r) => ({ method: r.method, path: r.path, status_code: r.status_code, response_body: r.response_body, delay_ms: r.delay_ms }));
    const res = await onImport({
      endpointId: target === "new" ? null : target,
      newEndpointName: newName,
      routes,
    });
    setResult(res);
    setImporting(false);
    setStep("result");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-[6vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-scale-in flex w-full max-w-xl flex-col overflow-hidden rounded-[12px] border border-border bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">
            {isRu ? "Импорт из Postman / Insomnia" : "Import from Postman / Insomnia"}
          </p>
          <button onClick={onClose} className="text-text-muted transition-colors hover:text-text-primary" aria-label={isRu ? "Закрыть" : "Close"}>
            <CloseIcon size={14} />
          </button>
        </div>

        {step === "pick" && (
          <div className="p-5">
            <p className="mb-4 text-sm text-text-secondary leading-relaxed">
              {isRu
                ? "Загрузи экспорт коллекции (Postman v2.0/v2.1 или Insomnia v4, JSON) — маршруты и, если они сохранены, примеры ответов превратятся в готовые mock-роуты."
                : "Upload a collection export (Postman v2.0/v2.1 or Insomnia v4, JSON) — its routes, and any saved response examples, become ready-to-use mock routes."}
            </p>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/40 hover:bg-surface-hover"
              }`}
            >
              <span className="text-accent"><UploadIcon size={22} /></span>
              <span className="text-sm font-medium text-text-primary">
                {isRu ? "Перетащи файл сюда или выбери" : "Drop a file here or choose one"}
              </span>
              <span className="text-xs text-text-muted">.json</span>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onFileInputChange} className="hidden" />
            </label>

            {fileError && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-red-400">
                <span className="mt-0.5 shrink-0"><WarningIcon size={12} /></span>
                {fileError}
              </p>
            )}

            <p className="mt-4 text-xs text-text-muted leading-relaxed">
              {isRu
                ? "Совет: в Postman сохрани хотя бы один пример ответа для каждого запроса перед экспортом (Save Response → Save as Example) — тогда импортированный маршрут сразу отвечает реальными данными, без ручной правки тела."
                : "Tip: in Postman, save at least one response example per request before exporting (Save Response → Save as Example) — the imported route then answers with real data right away, no manual body editing needed."}
            </p>
          </div>
        )}

        {step === "preview" && parsed && (
          <div className="flex max-h-[75vh] flex-col">
            <div className="border-b border-border px-5 py-4">
              <p className="text-sm text-text-primary">
                {isRu ? "Найдено в " : "Found in "}
                <span className="font-semibold">&laquo;{parsed.collectionName}&raquo;</span>
                {isRu ? ": " : ": "}
                <span className="font-semibold">{parsed.routes.length}</span>
                {isRu ? ` маршрут(ов) (${parsed.format === "postman" ? "Postman" : "Insomnia"})` : ` route(s) (${parsed.format === "postman" ? "Postman" : "Insomnia"})`}
              </p>
              {parsed.formatSupportsExamples ? (
                <p className="mt-1 text-xs text-text-muted">
                  {isRu
                    ? `${exampleCount} из ${parsed.routes.length} пришли с сохранённым примером ответа — они сразу рабочие. Остальные получат тело-заглушку, которое можно отредактировать после импорта.`
                    : `${exampleCount} of ${parsed.routes.length} came with a saved response example — those work immediately. The rest get a placeholder body you can edit after import.`}
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-400">
                  {isRu
                    ? "Экспорт Insomnia не несёт сохранённых тел ответа — все маршруты получат тело-заглушку, которое нужно будет отредактировать после импорта."
                    : "Insomnia exports don't include saved response bodies — every route gets a placeholder body you'll need to edit after import."}
                </p>
              )}
              {parsed.skipped.length > 0 && (
                <p className="mt-1 text-xs text-text-muted">
                  {isRu
                    ? `Пропущено ${parsed.skipped.length}: метод не GET/POST/PUT/PATCH/DELETE (${Array.from(new Set(parsed.skipped.map((s) => s.method))).join(", ")}).`
                    : `Skipped ${parsed.skipped.length}: method isn't GET/POST/PUT/PATCH/DELETE (${Array.from(new Set(parsed.skipped.map((s) => s.method))).join(", ")}).`}
                </p>
              )}
              {parsed.truncated && (
                <p className="mt-1 text-xs text-amber-400">
                  {isRu ? "Коллекция очень большая — показаны первые маршруты." : "Collection is very large — showing the first routes only."}
                </p>
              )}
            </div>

            <div className="border-b border-border px-5 py-4">
              <p className="input-label mb-2">{isRu ? "Куда сохранить" : "Save into"}</p>
              <div className="space-y-1.5">
                {canCreateNew && (
                  <label className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                    <input type="radio" name="import-target" checked={target === "new"} onChange={() => setTarget("new")} className="accent-accent" />
                    <span className="text-text-primary">{isRu ? "Новый эндпоинт:" : "New endpoint:"}</span>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={target !== "new"}
                      placeholder={isRu ? "Название" : "Name"}
                      className="code-surface min-w-0 flex-1 rounded px-2 py-1 text-xs text-text-primary outline-none disabled:opacity-50"
                    />
                  </label>
                )}
                {endpoints.map((ep) => (
                  <label key={ep.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                    <input type="radio" name="import-target" checked={target === ep.id} onChange={() => setTarget(ep.id)} className="accent-accent" />
                    <span className="min-w-0 flex-1 truncate text-text-primary">{ep.name || (isRu ? "Без названия" : "Untitled endpoint")}</span>
                    <span className="shrink-0 text-xs text-text-muted">{ep.mock_routes.length} / {maxRoutesPerEndpoint}</span>
                  </label>
                ))}
                {!canCreateNew && endpoints.length === 0 && (
                  <p className="text-xs text-red-400">
                    {isRu ? "Достигнут лимит эндпоинтов." : "You've reached the endpoint limit."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="space-y-1.5">
                {parsed.routes.map((route, i) => (
                  <RouteRow key={i} route={route} checked={selected.has(i)} onToggle={() => toggle(i)} isRu={isRu} />
                ))}
              </div>
            </div>

            <div className="border-t border-border px-5 py-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className={overCapacity ? "text-red-400" : "text-text-muted"}>
                  {isRu ? `Выбрано ${selectedCount} из ${targetCapacity} доступных слотов.` : `${selectedCount} selected of ${targetCapacity} available slots.`}
                </span>
                {overCapacity && !isPro && (
                  <Link href={localePath(locale, "/pro")} className="text-accent hover:underline">
                    {isRu ? "нужно больше? Pro" : "need more? Pro"}
                  </Link>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep("pick")} className="rounded border border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-hover">
                  {isRu ? "Назад" : "Back"}
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0 || overCapacity || (target === "new" && !canCreateNew)}
                  className="flex-1 rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing
                    ? (isRu ? "Импортирую..." : "Importing...")
                    : (isRu ? `Импортировать ${selectedCount}` : `Import ${selectedCount}`)}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="p-5">
            {result.error === "save-failed" && (
              <p className="text-sm text-red-400">
                {isRu ? "Не удалось сохранить — попробуй ещё раз." : "Couldn't save — please try again."}
              </p>
            )}
            {result.error === "endpoint-limit" && (
              <p className="text-sm text-red-400">
                {isRu ? "Достигнут лимит эндпоинтов — удали один или обнови до Pro." : "You've reached the endpoint limit — delete one or upgrade to Pro."}
              </p>
            )}
            {!result.error && (
              <>
                <p className="flex items-center gap-2 text-sm text-text-primary">
                  <span className="text-emerald-400"><CheckIcon size={14} /></span>
                  {isRu ? `Сохранено маршрутов: ${result.saved}.` : `Saved ${result.saved} route(s).`}
                </p>
                {result.skipped > 0 && (
                  <p className="mt-2 text-xs text-amber-400">
                    {isRu
                      ? `Пропущено ${result.skipped} — превышен лимит маршрутов для этого эндпоинта.`
                      : `Skipped ${result.skipped} — over the route limit for this endpoint.`}
                  </p>
                )}
              </>
            )}
            <button onClick={onClose} className="mt-4 w-full rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90">
              {isRu ? "Готово" : "Done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RouteRow({ route, checked, onToggle, isRu }: { route: ParsedRoute; checked: boolean; onToggle: () => void; isRu: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs">
      <input type="checkbox" checked={checked} onChange={onToggle} className="accent-accent" />
      <span className="shrink-0 rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-semibold text-accent">{route.method}</span>
      <code className="min-w-0 flex-1 truncate text-text-primary">{route.path}</code>
      <span className={`shrink-0 rounded px-1.5 py-0.5 ${route.hasExample ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-hover text-text-muted"}`}>
        {route.hasExample ? (isRu ? "пример" : "example") : (isRu ? "заглушка" : "placeholder")}
      </span>
    </label>
  );
}
