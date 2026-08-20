"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath } from "@/lib/i18n/config";

const FREE_LIMIT = 3;

export function AiUsageBadge({ toolSlug }: { toolSlug: string }) {
  const { user } = useAuth();
  const { locale } = useDict();
  const isRu = locale === "ru";
  const [used,  setUsed]  = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    const supabase = createClient();
    const today    = new Date().toISOString().slice(0, 10);

    Promise.all([
      supabase.from("ai_usage").select("count").eq("user_id", user.id).eq("used_at", today).single(),
      supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).single(),
    ]).then(([usage, sub]) => {
      setUsed(usage.data?.count ?? 0);
      setIsPro(sub.data?.plan === "pro" && sub.data?.status === "active");
      setLoaded(true);
    });
  }, [user]);

  if (!loaded || !user) return null;
  if (isPro) return (
    <div className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
      Pro · {isRu ? "Безлимит" : "Unlimited"}
    </div>
  );

  const remaining = Math.max(0, FREE_LIMIT - used);
  const isExhausted = remaining === 0;

  return (
    <div className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${
      isExhausted
        ? "border-red-500/30 bg-red-500/10 text-red-400"
        : "border-border bg-surface text-text-muted"
    }`}>
      <span>{isRu ? `${remaining}/${FREE_LIMIT} AI сегодня` : `${remaining}/${FREE_LIMIT} AI today`}</span>
      {isExhausted && (
        <Link href={localePath(locale, "/pro")}
          className="rounded bg-accent px-1.5 py-px text-[10px] font-semibold text-accent-fg hover:bg-amber-400 transition-colors">
          Pro
        </Link>
      )}
    </div>
  );
}
