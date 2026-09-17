import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  // Транзакционная страница — не должна попадать в индекс (та же причина,
  // по которой /auth/* целиком сознательно пропущен в sitemap.ts).
  return { title: getDictionary(locale).auth.signUp, robots: { index: false, follow: false } };
}

export default async function SignupPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <AuthCard title={dict.auth.signUp}>
      <SignupForm dict={dict} locale={locale} />
    </AuthCard>
  );
}
