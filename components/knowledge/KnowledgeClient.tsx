"use client";
import { useMemo, useState } from "react";
import { ROADMAPS, RESOURCES, KnowledgeRole, ResourceType } from "@/lib/knowledge/content";
import { Locale } from "@/lib/i18n/config";

interface Props { locale: Locale; }

const ROLE_FILTERS: { id: KnowledgeRole | "all"; label: string; labelRu: string }[] = [
  { id:"all",      label:"All",      labelRu:"Все" },
  { id:"qa",       label:"QA",       labelRu:"QA" },
  { id:"frontend", label:"Frontend", labelRu:"Frontend" },
  { id:"backend",  label:"Backend",  labelRu:"Backend" },
];

const TYPE_META: Record<ResourceType, { label: string; labelRu: string; color: string }> = {
  article:  { label:"Article",  labelRu:"Статья",      color:"text-blue-400 border-blue-500/30 bg-blue-500/10" },
  book:     { label:"Book",     labelRu:"Книга",       color:"text-amber-400 border-amber-500/30 bg-amber-500/10" },
  course:   { label:"Course",   labelRu:"Курс",        color:"text-violet-400 border-violet-500/30 bg-violet-500/10" },
  video:    { label:"Video",    labelRu:"Видео",       color:"text-red-400 border-red-500/30 bg-red-500/10" },
  tool:     { label:"Tool",     labelRu:"Инструмент",  color:"text-green-400 border-green-500/30 bg-green-500/10" },
  roadmap:  { label:"Roadmap",  labelRu:"Roadmap",     color:"text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
};

const PHASE_COLORS = [
  "border-blue-500/30 bg-blue-500/5",
  "border-violet-500/30 bg-violet-500/5",
  "border-amber-500/30 bg-amber-500/5",
  "border-green-500/30 bg-green-500/5",
  "border-red-500/30 bg-red-500/5",
];

export function KnowledgeClient({ locale }: Props) {
  const isRu = locale === "ru";
  const [tab,    setTab]    = useState<"roadmaps" | "resources">("roadmaps");
  const [role,   setRole]   = useState<KnowledgeRole | "all">("all");
  const [search, setSearch] = useState("");

  const filteredRoadmaps = useMemo(() =>
    ROADMAPS.filter(r => role === "all" || r.role === role), [role]);

  const filteredResources = useMemo(() => {
    const q = search.toLowerCase().trim();
    return RESOURCES.filter(r => {
      const matchRole = role === "all" || r.tags.includes(role) || r.tags.includes("all");
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.includes(q));
      return matchRole && matchSearch;
    });
  }, [role, search]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8">
        <span className="rounded border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400 uppercase tracking-wider">
          {isRu ? "База знаний" : "Knowledge Base"}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-text-primary">
          {isRu ? "Ресурсы и дорожные карты" : "Resources & Roadmaps"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-lg">
          {isRu ? "Курированные ресурсы и roadmap-ы для QA, Frontend и Backend." : "Curated resources and roadmaps for QA, Frontend and Backend developers."}
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        {(["roadmaps","resources"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-5 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-canvas text-text-primary" : "text-text-muted hover:text-text-secondary"}`}>
            {t === "roadmaps" ? (isRu ? "Roadmap-ы" : "Roadmaps") : (isRu ? `Ресурсы (${RESOURCES.length})` : `Resources (${RESOURCES.length})`)}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex rounded border border-border overflow-hidden">
          {ROLE_FILTERS.map(r => (
            <button key={r.id} onClick={() => setRole(r.id)}
              className={`px-4 py-1.5 text-sm transition-colors ${role === r.id ? "bg-accent text-accent-fg font-medium" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? r.labelRu : r.label}
            </button>
          ))}
        </div>
        {tab === "resources" && (
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isRu ? "Поиск ресурсов…" : "Search resources…"}
            className="code-surface rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none flex-1 min-w-[200px]" />
        )}
      </div>

      {tab === "roadmaps" && (
        <div className="space-y-8">
          {filteredRoadmaps.map(roadmap => (
            <div key={roadmap.id} className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold text-text-primary">{isRu ? roadmap.titleRu : roadmap.title}</h2>
                <p className="mt-1 text-sm text-text-secondary">{isRu ? roadmap.descriptionRu : roadmap.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
                {roadmap.phases.map((phase, i) => (
                  <div key={i} className={`rounded-lg border p-4 ${PHASE_COLORS[i % PHASE_COLORS.length]}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas border border-border text-xs font-bold text-text-muted">{i+1}</span>
                      <h3 className="text-sm font-semibold text-text-primary">{isRu ? phase.titleRu : phase.title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {(isRu ? phase.itemsRu : phase.items).map((item, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-text-muted">
                          <span className="mt-0.5 shrink-0 text-text-disabled">·</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted mb-4">{filteredResources.length} {isRu ? "ресурсов" : "resources"}</p>
          {filteredResources.map((res, i) => {
            const meta = TYPE_META[res.type];
            return (
              <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4 hover:border-border-focus hover:bg-surface-hover transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded border px-1.5 py-px text-[10px] font-medium ${meta.color}`}>{isRu ? meta.labelRu : meta.label}</span>
                    <span className={`text-[10px] ${res.free ? "text-success" : "text-text-muted"}`}>{res.free ? "Free" : "Paid"}</span>
                    {res.tags.slice(0,3).map(tag => (
                      <span key={tag} className="text-[10px] text-text-disabled border border-border rounded px-1">{tag}</span>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{res.title}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{isRu ? (res.descriptionRu ?? res.description) : res.description}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-1 text-text-muted group-hover:text-accent transition-colors">
                  <path d="M3 13L13 3M13 3H7M13 3v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}