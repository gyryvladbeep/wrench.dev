"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { allTools } from "@/lib/tools-registry";
import { localizeTool } from "@/lib/i18n/localize";
import { WorkbenchCanvas } from "@/components/workbench/WorkbenchCanvas";
import { WORKBENCH_UI } from "@/lib/i18n/workbench-content";
import { GameIcon } from "@/components/icons/GameIcons";
import { ToolPosition } from "@/lib/workbench-layout";

interface PublicWorkbench {
  id: string;
  name: string;
  tool_slugs: string[];
  layout: Record<string, ToolPosition>;
}

interface PublicWorkbenchViewProps {
  locale: Locale;
  id: string;
}

// "не найдено" покрывает три разных случая одной и той же надписью:
// строка не существует, чужой приватный workbench, автор выключил шаринг
// после того, как ссылку кому-то отправили. Разбирать их по отдельности
// не нужно и даже вредно — это ничего не даёт зрителю по ссылке, а вот
// "это приватный стол другого юзера" звучало бы как утечка информации о
// том, что id вообще существует в базе.
type ViewState = { kind: "loading" } | { kind: "not-found" } | { kind: "found"; workbench: PublicWorkbench };

export function PublicWorkbenchView({ locale, id }: PublicWorkbenchViewProps) {
  const { dict } = useDict();
  const t = WORKBENCH_UI[locale];
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });

    // Фильтруем только по id, а не ещё и по is_public — эту часть уже
    // делает RLS-политика workbenches_select_public (is_public = true) на
    // стороне базы (см. supabase/workbench-schema.sql): для анонимного
    // посетителя приватный ряд просто не существует в ответе, каким бы ни
    // был WHERE в самом запросе. Так и остальные запросы в этом проекте
    // (см. useWorkbenches.ts) доверяют RLS как единственному месту, где
    // проверяется доступ, а не дублируют проверку в JS.
    const supabase = createClient();
    supabase
      .from("workbenches")
      .select("id, name, tool_slugs, layout")
      .eq("id", id)
      .single()
      .then(({ data, error }: { data: PublicWorkbench | null; error: unknown }) => {
        if (cancelled) return;
        if (error || !data) { setState({ kind: "not-found" }); return; }
        setState({ kind: "found", workbench: data });
      });

    return () => { cancelled = true; };
  }, [id]);

  if (state.kind === "loading") return null;

  if (state.kind === "not-found") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mb-3 flex justify-center text-text-muted"><GameIcon id="wrench" size={28} /></div>
        <h1 className="text-lg font-semibold text-text-primary">{t.publicNotFoundTitle}</h1>
        <p className="mt-2 text-sm text-text-muted">{t.publicNotFoundBody}</p>
        <Link
          href={localePath(locale, "/")}
          className="mt-5 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400"
        >
          {t.publicCta}
        </Link>
      </div>
    );
  }

  const { workbench } = state;
  const tools = workbench.tool_slugs
    .map((slug) => allTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
    .map((tool) => localizeTool(tool, locale));

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-text-primary">{workbench.name}</h1>
        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-text-muted">
          {t.publicBadge}
        </span>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">{t.publicEmptyBody}</p>
        </div>
      ) : (
        <WorkbenchCanvas tools={tools} layout={workbench.layout} dict={dict} locale={locale} readOnly />
      )}
    </div>
  );
}
