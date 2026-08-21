import { createServerSupabaseClient } from "@/lib/supabase/server";

const FREE_LIMIT_PER_DAY = 3;

export async function checkAiUsage(userId: string, toolSlug: string): Promise<{
  allowed: boolean;
  remaining: number;
  isPro: boolean;
}> {
  const supabase = createServerSupabaseClient();

  // Check if Pro
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .single();

  const isPro = sub?.plan === "pro" && sub?.status === "active";
  if (isPro) return { allowed: true, remaining: -1, isPro: true };

  // Check today's usage
  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("used_at", today)
    .single();

  const used      = usage?.count ?? 0;
  const remaining = FREE_LIMIT_PER_DAY - used;

  return { allowed: remaining > 0, remaining: Math.max(0, remaining), isPro: false };
}

export async function incrementAiUsage(userId: string, toolSlug: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const today    = new Date().toISOString().slice(0, 10);

  await supabase.from("ai_usage").upsert({
    user_id:  userId,
    tool_slug: toolSlug,
    used_at:  today,
    count:    1,
  }, { onConflict: "user_id,tool_slug,used_at" });

  // If exists, increment
  await supabase.rpc("increment_ai_usage", {
    p_user_id:  userId,
    p_tool_slug: toolSlug,
    p_date:     today,
  }).catch(() => {}); // Ignore if RPC doesn't exist yet
}
