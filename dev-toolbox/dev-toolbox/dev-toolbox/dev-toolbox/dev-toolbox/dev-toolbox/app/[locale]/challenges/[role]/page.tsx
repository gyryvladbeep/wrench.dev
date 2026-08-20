import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { ROLE_META, ChallengeRole } from "@/lib/challenges/types";
import { ChallengeArena } from "@/components/challenges/ChallengeArena";

const VALID_ROLES: ChallengeRole[] = ["qa", "frontend", "backend"];

export function generateStaticParams() {
  return [{ locale:"en" }, { locale:"ru" }].flatMap((l) =>
    VALID_ROLES.map((role) => ({ ...l, role }))
  );
}

export async function generateMetadata({ params }: { params: { locale: string; role: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  const meta   = ROLE_META[params.role as ChallengeRole];
  if (!meta) return {};
  return buildPageMetadata(locale, `/challenges/${params.role}`,
    isRu ? `${meta.labelRu} — Wrench Challenges` : `${meta.label} — Wrench Challenges`,
    isRu ? `Ежедневные задачи для ${meta.labelRu}.` : `Daily challenges for ${meta.label}s.`
  );
}

export default function ChallengeRolePage({ params }: { params: { locale: string; role: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  if (!VALID_ROLES.includes(params.role as ChallengeRole)) notFound();
  const role = params.role as ChallengeRole;
  const meta = ROLE_META[role];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href={localePath(locale, "/")} className="hover:text-text-secondary transition-colors">
          {isRu ? "Главная" : "Home"}
        </Link>
        <span>/</span>
        <Link href={localePath(locale, "/challenges")} className="hover:text-text-secondary transition-colors">
          Challenges
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{isRu ? meta.labelRu : meta.label}</span>
      </nav>

      <ChallengeArena role={role} locale={locale} />
    </div>
  );
}
