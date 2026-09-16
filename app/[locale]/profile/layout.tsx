import { Metadata } from "next";

// /profile показывает только приватные данные текущего пользователя и
// без сессии никого не пускает — не должен попадать в индекс поисковика
// (та же причина, по которой /profile сознательно пропущен в sitemap.ts).
// page.tsx в этой папке — "use client" и не может сам экспортировать
// generateMetadata/metadata, поэтому noindex вынесен в этот layout.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
