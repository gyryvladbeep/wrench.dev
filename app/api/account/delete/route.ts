import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Удаляет аккаунт пользователя навсегда.
 *
 * Что происходит:
 *  1. Best-effort отмена подписки в Stripe, если она есть — Supabase
 *     ничего не знает про Stripe, и auth.admin.deleteUser() ниже НЕ
 *     остановит списания по активной подписке сам по себе. Ошибка
 *     здесь НЕ должна блокировать удаление аккаунта: повисшая
 *     Stripe-подписка — решаемая вручную проблема, а "аккаунт не
 *     удалился после ответа 'аккаунт удалён'" — куда хуже.
 *  2. auth.admin.deleteUser(user.id) — удаляет пользователя из
 *     auth.users. Каскадом (ON DELETE CASCADE, см. profile-schema.sql,
 *     favorites-schema.sql, workbench-schema.sql, challenges-schema.sql)
 *     это тянет за собой ВСЕ связанные строки: profiles, tool_history,
 *     achievements, favorites, workbenches, challenge_attempts,
 *     user_streaks, subscriptions, ai_usage. Отдельно удалять их не
 *     нужно — ровно один вызов делает всё.
 */
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .single();

    if (sub?.stripe_subscription_id && sub.status !== "canceled") {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    }
  } catch (err) {
    console.error("account delete: Stripe cancellation failed (continuing with account deletion)", err);
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (err) {
    console.error("account delete: failed to delete Supabase user", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
