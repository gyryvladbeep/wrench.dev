import { createServerSupabaseClient } from "@/lib/supabase/server";

const FREE_LIMIT = 3;

export interface AiLimitResult {
  allowed:   boolean;
  remaining: number;
  isPro:     boolean;
}

/**
 * Check AI usage limit for the current user.
 * Returns { allowed, remaining, isPro }.
 * If user is not authenticated → denied.
 * If user is Pro → always allowed.
 * If free → check ai_usage table for today's count.
 */
export async function checkAiLimit(): Promise<AiLimitResult> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, remaining: 0, isPro: false };

  // Check Pro subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const isPro = sub?.plan === "pro" && sub?.status === "active";
  if (isPro) return { allowed: true, remaining: Infinity, isPro: true };

  // Check today's usage
  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("used_at", today)
    .single();

  const used = (usage as { count: number } | null)?.count ?? 0;
  const remaining = Math.max(0, FREE_LIMIT - used);
  return { allowed: remaining > 0, remaining, isPro: false };
}

/**
 * Increment AI usage counter for today.
 */
export async function incrementAiUsage(): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("id, count")
    .eq("user_id", user.id)
    .eq("used_at", today)
    .single();

  if (existing) {
    await supabase.from("ai_usage")
      .update({ count: (existing as { id: string; count: number }).count + 1 })
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("ai_usage")
      .insert({ user_id: user.id, used_at: today, count: 1 });
  }
}