"use client";
import { useState } from "react";
import { useDict } from "@/lib/i18n/dict-context";
import { useApiTokens } from "@/lib/hooks/useApiTokens";
import { CopyButton } from "@/components/CopyButton";
import { LockIcon, CloseIcon, CheckIcon } from "@/components/icons/GameIcons";

// ═══════════════════════════════════════════════════════════════
// Личные токены API-доступа — используются внешними запросами
// (curl/CI/GitHub Action, см. .github/actions/wrench-mock-api и
// .github/actions/wrench-webhook-bin) для создания mock-эндпоинтов и
// webhook-бинов от лица этого пользователя без браузерной сессии
// (пункт 13 из ROADMAP-BRAINSTORM.md). Вся логика хранения —
// lib/hooks/useApiTokens.ts, тут только форма создания + список +
// отзыв, тот же принцип разделения, что уже у остальных панелей
// профиля (ProfileHero, PublicProfileView).
//
// Токен в открытом виде показывается РОВНО один раз, сразу после
// создания (revealedToken ниже) — после закрытия этого блока
// восстановить его нельзя даже владельцу, только отозвать и создать
// новый. Та же логика, что у GitHub/Stripe API-ключей.
export function ApiTokensPanel() {
  const { locale } = useDict();
  const isRu = locale === "ru";
  const { tokens, loading, activeCount, maxTokens, createToken, revokeToken } = useApiTokens();

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const atLimit = activeCount >= maxTokens;

  async function handleCreate() {
    if (!name.trim() || atLimit || creating) return;
    setCreating(true);
    setCreateError(null);
    const result = await createToken(name);
    setCreating(false);
    if (typeof result === "string") {
      setCreateError(
        result === "token-limit"
          ? (isRu ? `Достигнут лимит токенов (${maxTokens}).` : `Token limit reached (${maxTokens}).`)
          : (isRu ? "Не удалось создать токен. Попробуй ещё раз." : "Couldn't create the token. Try again.")
      );
      return;
    }
    setRevealedToken(result.token);
    setName("");
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(isRu ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-text-muted"><LockIcon size={15} /></span>
        <h2 className="text-sm font-semibold text-text-primary">{isRu ? "API-токены" : "API tokens"}</h2>
      </div>
      <p className="text-xs text-text-muted">
        {isRu
          ? "Личный токен позволяет создавать mock-эндпоинты и webhook-бины из скриптов/CI без входа в браузере — см. curl-пример и GitHub Action в "
          : "A personal token lets scripts/CI create mock endpoints and webhook bins without a browser session — see the curl example and GitHub Action in "}
        <a href="/docs#api" className="text-link hover:underline">/docs</a>.
      </p>

      {/* Разовый показ только что созданного токена — не часть списка
          ниже, отдельный явно выделенный блок, чтобы нельзя было
          спутать с обычной строкой списка (тут единственное место, где
          вообще виден токен целиком). */}
      {revealedToken && (
        <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
          <p className="text-xs font-medium text-accent">
            {isRu ? "Скопируй токен сейчас — он больше нигде не покажется." : "Copy this token now — it won't be shown again."}
          </p>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-2.5 py-1.5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{revealedToken}</span>
            <CopyButton value={revealedToken} iconOnly />
          </div>
          <button onClick={() => setRevealedToken(null)} className="text-xs text-text-muted hover:text-text-primary transition-colors">
            {isRu ? "Понял, скрыть" : "Got it, dismiss"}
          </button>
        </div>
      )}

      {/* Форма создания */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          placeholder={isRu ? "Название (например, «GitHub Actions»)" : "Name (e.g. \"GitHub Actions\")"}
          disabled={atLimit || creating}
          maxLength={100}
          className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
        />
        <button
          onClick={handleCreate}
          disabled={!name.trim() || atLimit || creating}
          className="shrink-0 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {creating ? (isRu ? "Создаю…" : "Creating…") : (isRu ? "Создать токен" : "Create token")}
        </button>
      </div>
      {atLimit && (
        <p className="text-xs text-amber-400">
          {isRu ? `Лимит токенов достигнут (${maxTokens}) — отзови неиспользуемый, чтобы создать новый.` : `Token limit reached (${maxTokens}) — revoke an unused one to create a new one.`}
        </p>
      )}
      {createError && <p className="text-xs text-red-400">{createError}</p>}

      {/* Список существующих токенов */}
      {!loading && tokens.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-3">
          {tokens.map((t) => {
            const revoked = Boolean(t.revoked_at);
            return (
              <div key={t.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${revoked ? "border-border/60 opacity-50" : "border-border"}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm text-text-primary">{t.name}</p>
                  <p className="truncate font-mono text-[11px] text-text-muted">
                    {t.token_prefix}… · {isRu ? "создан" : "created"} {formatDate(t.created_at)}
                    {t.last_used_at && ` · ${isRu ? "использован" : "used"} ${formatDate(t.last_used_at)}`}
                    {revoked && ` · ${isRu ? "отозван" : "revoked"}`}
                  </p>
                </div>
                {!revoked && (
                  confirmRevokeId === t.id ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => { revokeToken(t.id); setConfirmRevokeId(null); }}
                        className="flex items-center gap-1 rounded border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                        <CheckIcon size={11} /> {isRu ? "Точно?" : "Confirm?"}
                      </button>
                      <button onClick={() => setConfirmRevokeId(null)}
                        className="rounded p-1 text-text-muted hover:text-text-primary transition-colors">
                        <CloseIcon size={11} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRevokeId(t.id)}
                      className="shrink-0 text-xs text-text-muted hover:text-red-400 transition-colors">
                      {isRu ? "Отозвать" : "Revoke"}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
