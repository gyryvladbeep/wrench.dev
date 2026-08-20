"use client";
import Link from "next/link";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";

export default function ProSuccessPage() {
  const { locale } = useDict();
  const isRu = locale === "ru";

  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <div className="mb-6 text-5xl">🎉</div>
      <h1 className="text-2xl font-bold text-text-primary">
        {isRu ? "Добро пожаловать в Pro!" : "Welcome to Pro!"}
      </h1>
      <p className="mt-3 text-text-secondary">
        {isRu
          ? "Твоя подписка активна. Теперь у тебя безлимитные AI-генерации и полный архив задач."
          : "Your subscription is active. You now have unlimited AI generations and full challenge archive."}
      </p>
      <div className="mt-8 flex flex-col gap-3 items-center">
        <Link href={localePath(locale, "/tools/test-case-generator")}
          className="rounded bg-accent px-6 py-2.5 text-sm font-medium text-accent-fg hover:bg-amber-400 transition-colors">
          {isRu ? "Попробовать AI инструменты" : "Try AI Tools"}
        </Link>
        <Link href={localePath(locale, "/challenges")}
          className="text-sm text-link hover:underline">
          {isRu ? "Перейти к задачам" : "Go to Challenges"}
        </Link>
      </div>
    </div>
  );
}
