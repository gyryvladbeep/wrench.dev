import { Metadata } from "next";

// Транзакционная страница, которую видно только сразу после успешной
// оплаты — не должна попадать в индекс, как и /auth/* и /profile.
// page.tsx в этой папке — "use client", поэтому noindex вынесен сюда.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
