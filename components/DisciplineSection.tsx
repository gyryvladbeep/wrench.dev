import Link from "next/link";
import { DisciplineMeta, getToolsForDiscipline, getDisciplineToolCount } from "@/lib/disciplines";
import { Locale, localePath } from "@/lib/i18n/config";
import { localizeTools } from "@/lib/i18n/localize";
import { ToolCard } from "@/components/ToolCard";

export function DisciplineSection({ discipline, locale, isRu, limit = 4 }: {
  discipline: DisciplineMeta; locale: Locale; isRu: boolean; limit?: number;
}) {
  const tools = localizeTools(getToolsForDiscipline(discipline.id, limit), locale);
  const total = getDisciplineToolCount(discipline.id);
  if (tools.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
            style={{ background: `${discipline.color}15` }}>
            {discipline.icon}
          </span>
          <div>
            <h2 className="text-base font-bold text-text-primary">{isRu ? discipline.labelRu : discipline.labelEn}</h2>
            <p className="text-xs text-text-muted">{isRu ? discipline.taglineRu : discipline.taglineEn}</p>
          </div>
        </div>
        <Link href={localePath(locale, `/tools?discipline=${discipline.id}`)}
          className="shrink-0 text-xs font-medium hover:underline flex items-center gap-1"
          style={{ color: discipline.color }}>
          {isRu ? `Все (${total})` : `All (${total})`} →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-xl overflow-hidden bg-border">
        {tools.map((t) => (
          <div key={t.slug} className="bg-canvas hover:bg-surface transition-colors">
            <ToolCard tool={t} />
          </div>
        ))}
      </div>
    </section>
  );
}