import { Metadata } from "next";
import Link from "next/link";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isRu = params.locale === "ru";
  return {
    title: isRu ? "Политика конфиденциальности — Wrench-Branch" : "Privacy Policy — Wrench-Branch",
    description: isRu ? "Как мы обрабатываем ваши данные." : "How we handle your data.",
  };
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-bold text-text-primary mb-2">
        {isRu ? "Политика конфиденциальности" : "Privacy Policy"}
      </h1>
      <p className="text-sm text-text-muted mb-10">
        {isRu ? "Последнее обновление: 1 сентября 2026" : "Last updated: September 1, 2026"}
      </p>

      <div className="space-y-8 text-sm text-text-secondary leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Коротко" : "The short version"}
          </h2>
          <p>
            {isRu
              ? "Каждый инструмент на Wrench-Branch работает полностью в вашем браузере. Когда вы вставляете JSON в форматтер или декодируете JWT — данные обрабатываются локально на вашем устройстве и никогда не отправляются на наши серверы. Исключение — инструмент Header Inspector, который делает запрос к указанному вами URL для чтения заголовков ответа. Мы не логируем проверяемые URL."
              : "Every tool on Wrench-Branch runs entirely in your browser. When you paste JSON into the formatter or decode a JWT, that data is processed locally on your device and is never sent to our servers. The one exception is the Header Inspector, which makes a request to the URL you provide in order to read its response headers — we don't log the URLs you inspect."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Данные аккаунта" : "Account data"}
          </h2>
          <p>
            {isRu
              ? "Если вы создаёте аккаунт, мы храним ваш email адрес и минимальные данные для работы сервиса: статус подписки, история использования инструментов, результаты Challenges, настройки профиля. Мы не продаём персональные данные третьим лицам."
              : "If you create an account, we store your email address and the minimum data needed to operate the service: subscription status, tool usage history, Challenge results, and profile settings. We do not sell personal data to third parties."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Обработчики данных" : "Data processors"}
          </h2>
          <p className="mb-3">
            {isRu
              ? "Для работы сервиса мы используем следующих обработчиков данных:"
              : "We use the following sub-processors to operate the service:"}
          </p>
          <ul className="space-y-2 list-none">
            {[
              { name:"Supabase",  purpose: isRu ? "База данных и аутентификация" : "Database and authentication",     link:"https://supabase.com/privacy" },
              { name:"Stripe",    purpose: isRu ? "Обработка платежей" : "Payment processing",                       link:"https://stripe.com/privacy" },
              { name:"Vercel",    purpose: isRu ? "Хостинг и деплой" : "Hosting and deployment",                     link:"https://vercel.com/legal/privacy-policy" },
              { name:"Anthropic", purpose: isRu ? "AI генерация (для Pro функций)" : "AI generation (Pro features)", link:"https://www.anthropic.com/privacy" },
            ].map(p => (
              <li key={p.name} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
                <span className="font-semibold text-text-primary w-20 shrink-0">{p.name}</span>
                <span className="text-text-muted">{p.purpose} —{" "}
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                    {isRu ? "политика конфиденциальности" : "privacy policy"}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Аналитика" : "Analytics"}
          </h2>
          <p>
            {isRu
              ? "Мы используем анонимизированную аналитику без cookie для понимания того, какие инструменты используются чаще всего. Мы не отслеживаем пользователей между сайтами и не строим рекламные профили."
              : "We use privacy-friendly, cookie-free analytics to understand which tools are used most. We do not track individuals across sites or build advertising profiles."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Ваши права (GDPR)" : "Your rights (GDPR)"}
          </h2>
          <p className="mb-3">
            {isRu
              ? "Если вы находитесь в Европейском союзе, у вас есть следующие права:"
              : "If you are in the European Union, you have the following rights:"}
          </p>
          <ul className="space-y-1 text-text-muted">
            {(isRu ? [
              "Право на доступ к вашим данным",
              "Право на исправление неточных данных",
              "Право на удаление данных (удаление аккаунта)",
              "Право на ограничение обработки",
              "Право на переносимость данных",
            ] : [
              "Right to access your personal data",
              "Right to rectify inaccurate data",
              "Right to erasure (delete your account)",
              "Right to restrict processing",
              "Right to data portability",
            ]).map((right, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent shrink-0">·</span> {right}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            {isRu
              ? "Для удаления аккаунта и данных — напишите нам на "
              : "To delete your account and data, contact us at "}
            <a href="mailto:gyryseksa@outlook.com" className="text-link hover:underline">gyryseksa@outlook.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Cookies" : "Cookies"}
          </h2>
          <p>
            {isRu
              ? "Мы используем только функциональные cookie необходимые для работы сервиса: сессионные cookie для аутентификации и cookie для запоминания языка интерфейса. Мы не используем рекламные или трекинговые cookie."
              : "We only use functional cookies necessary to operate the service: session cookies for authentication and a cookie to remember your language preference. We do not use advertising or tracking cookies."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            {isRu ? "Контакт" : "Contact"}
          </h2>
          <p>
            {isRu
              ? "Вопросы об этой политике можно направить на "
              : "Questions about this policy can be sent to "}
            <a href="mailto:gyryseksa@outlook.com" className="text-link hover:underline">gyryseksa@outlook.com</a>.
          </p>
        </section>

        <div className="rounded-lg border border-border bg-surface/50 p-4 text-xs text-text-muted">
          {isRu
            ? "Эта политика является отправной точкой и не является юридической консультацией. Рекомендуется проверить её с юристом в вашей юрисдикции."
            : "This policy is a starting point, not legal advice. Have it reviewed by a lawyer familiar with your jurisdiction."}
        </div>

      </div>
    </div>
  );
}