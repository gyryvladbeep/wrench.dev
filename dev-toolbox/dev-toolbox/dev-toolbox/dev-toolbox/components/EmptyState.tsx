"use client";
import Link from "next/link";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath } from "@/lib/i18n/config";

interface EmptyStateProps {
  icon?: string; title: string; description?: string;
  action?: { label:string; href?:string; onClick?:()=>void };
  hint?: string; size?: "sm"|"md"|"lg";
}

export function EmptyState({ icon="{}", title, description, action, hint, size="md" }: EmptyStateProps) {
  const pad = size==="sm"?"py-6":size==="lg"?"py-16":"py-10";
  const ico = size==="sm"?"text-2xl":"text-4xl";
  const ttl = size==="sm"?"text-sm font-medium":"text-base font-semibold";
  return (
    <div className={`flex flex-col items-center justify-center text-center ${pad} px-4`}>
      <span className={`${ico} opacity-25 mb-3`}>{icon}</span>
      <p className={`${ttl} text-text-primary`}>{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-sm text-text-muted leading-relaxed">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.href
            ? <Link href={action.href} className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors">{action.label}</Link>
            : <button onClick={action.onClick} className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors">{action.label}</button>
          }
        </div>
      )}
      {hint && <p className="mt-3 text-xs text-text-muted opacity-60">{hint}</p>}
    </div>
  );
}

export function EmptyToolInput() {
  const { locale } = useDict();
  const isRu = locale==="ru";
  return <EmptyState icon="→" size="sm"
    title={isRu?"Вставьте данные слева":"Paste your data on the left"}
    description={isRu?"Результат появится автоматически.":"Result appears automatically."} />;
}

export function EmptyFavorites() {
  const { locale } = useDict();
  const isRu = locale==="ru";
  return <EmptyState icon="☆"
    title={isRu?"Нет избранного":"No favorites yet"}
    description={isRu?"Нажмите ☆ на любом инструменте.":"Click ☆ on any tool to save it."}
    action={{ label:isRu?"Все инструменты":"Browse tools", href:localePath(locale,"/tools") }} />;
}

export function EmptySearchResults({ query }: { query:string }) {
  const { locale } = useDict();
  const isRu = locale==="ru";
  return <EmptyState icon="⌕" size="sm"
    title={isRu?"Ничего не найдено":"No results found"}
    description={isRu?`По запросу «${query}» ничего нет.`:`No tools match "${query}".`}
    hint={isRu?"Попробуйте: json, regex, base64, uuid…":"Try: json, regex, base64, uuid…"} />;
}
