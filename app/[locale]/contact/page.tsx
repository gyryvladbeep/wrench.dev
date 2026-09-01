import { Metadata } from "next";
import Link from "next/link";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isRu = params.locale === "ru";
  return {
    title: isRu ? "Контакты — Wrench-Branch" : "Contact — Wrench-Branch",
    description: isRu ? "Связаться с командой Wrench-Branch." : "Get in touch with the Wrench-Branch team.",
  };
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";

  const TOPICS = isRu ? [
    { icon:"🐛", title:"Баг-репорт",          desc:"Нашёл баг в инструменте или на платформе?" },
    { icon:"💡", title:"Запрос инструмента",   desc:"Есть идея инструмента который был бы полезен?" },
    { icon:"💼", title:"Pro план и оплата",    desc:"Вопросы по подписке, возврат средств." },
    { icon:"🔒", title:"Безопасность",         desc:"Нашёл уязвимость? Сообщи нам ответственно." },
    { icon:"📋", title:"Общие вопросы",        desc:"Что-то ещё что не попадает в другие категории." },
  ] : [
    { icon:"🐛", title:"Bug report",           desc:"Found a bug in a tool or on the platform?" },
    { icon:"💡", title:"Tool request",         desc:"Have an idea for a tool that would be useful?" },
    { icon:"💼", title:"Pro & billing",        desc:"Questions about your subscription or refunds." },
    { icon:"🔒", title:"Security",             desc:"Found a vulnerability? Please disclose responsibly." },
    { icon:"📋", title:"General",              desc:"Anything else that doesn't fit other categories." },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-3xl font-bold text-text-primary mb-2">
        {isRu ? "Контакты" : "Contact"}
      </h1>
      <p className="text-sm text-text-secondary mb-10">
        {isRu
          ? "Нашёл баг, хочешь предложить инструмент или есть вопрос по Pro плану? Пишем сюда:"
          : "Found a bug, want to request a tool, or have a question about the Pro plan? Reach out:"}
      </p>

      {/* Email CTA */}
      <div className="rounded-xl border border-border bg-surface p-6 mb-8 text-center">
        <p className="text-2xl mb-3">✉️</p>
        <p className="text-base font-semibold text-text-primary mb-1">gyryseksa@outlook.com</p>
        <p className="text-xs text-text-muted mb-4">
          {isRu ? "Обычно отвечаем в течение 24-48 часов" : "We typically respond within 24-48 hours"}
        </p>
        <a href="mailto:gyryseksa@outlook.com"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-accent-fg transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          {isRu ? "Написать письмо" : "Send email"}
        </a>
      </div>

      {/* Topics */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
          {isRu ? "По каким вопросам пишут" : "Common topics"}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOPICS.map(t => (
            <a key={t.title} href="mailto:gyryseksa@outlook.com"
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 hover:border-[var(--accent)]/30 hover:bg-surface-hover transition-all group">
              <span className="text-xl shrink-0">{t.icon}</span>
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{t.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{t.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-lg border border-border bg-surface/50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          {isRu ? "Полезные ссылки" : "Helpful links"}
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: isRu ? "Политика конфиденциальности" : "Privacy Policy", href: "/privacy" },
            { label: isRu ? "Условия использования" : "Terms of Service",     href: "/terms" },
            { label: isRu ? "Pro план" : "Pro Plan",                           href: "/pro" },
          ].map(l => (
            <Link key={l.href} href={localePath(locale, l.href)}
              className="rounded border border-border bg-canvas px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-surface transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}