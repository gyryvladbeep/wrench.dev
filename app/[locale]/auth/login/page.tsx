import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).auth;
  // Транзакционная страница — не должна попадать в индекс (та же причина,
  // по которой /auth/* целиком сознательно пропущен в sitemap.ts).
  return { title: t.signIn, robots: { index: false, follow: false } };
}

export default async function LoginPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <AuthCard title={dict.auth.signIn}>
      <LoginForm dict={dict} locale={locale} />
    </AuthCard>
  );
}
